import { NextResponse } from "next/server";
import { generateImage, ratioToSize } from "@/lib/huggingface";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  aspectRatio: z.string().default("1:1"),
  resolution: z.string().default("1K"),
  style: z.string().optional(),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const params = RequestSchema.parse(body);

    const { width, height } = ratioToSize(params.aspectRatio, params.resolution);

    const images = await generateImage({
      prompt: params.prompt,
      width,
      height,
    });

    if (images.length === 0) {
      return NextResponse.json({ error: "画像が生成されませんでした" }, { status: 500 });
    }

    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const ext = images[i].mimeType.includes("png") ? "png" : "jpg";
      const filename = `${user.id}/${Date.now()}_${i}.${ext}`;
      const { data } = await supabase.storage
        .from("generations")
        .upload(filename, images[i].data, { contentType: images[i].mimeType });

      if (data) {
        const { data: urlData } = supabase.storage
          .from("generations")
          .getPublicUrl(filename);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const processingTime = Date.now() - startTime;

    await supabase.from("generations").insert({
      user_id: user.id,
      prompt: params.prompt,
      params: { style: params.style, aspectRatio: params.aspectRatio, resolution: params.resolution },
      output_images: uploadedUrls,
      model: "FLUX.1-schnell",
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      generation_type: "generate",
      processing_time_ms: processingTime,
    });

    return NextResponse.json({ images: uploadedUrls, processingTime });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid parameters", details: error.issues }, { status: 400 });
    }
    console.error("Banner generation error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("loading") || msg.includes("503")) {
      return NextResponse.json(
        { error: "AIモデルを起動中です（初回は30秒ほどかかります）。しばらく待ってから再試行してください。" },
        { status: 503 }
      );
    }
    if (msg.includes("rate") || msg.includes("429")) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。少し待ってから再試行してください。" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "画像生成に失敗しました。プロンプトを変えて再試行してください。" }, { status: 500 });
  }
}
