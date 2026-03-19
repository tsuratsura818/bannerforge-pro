import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const maxDuration = 60;

const RequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  aspectRatio: z.string().default("1:1"),
  resolution: z.string().default("1K"),
  style: z.string().optional(),
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

    // Gemini（Nano Banana 2）で画像生成
    const images = await generateImage({
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      resolution: params.resolution,
    });

    if (images.length === 0) {
      return NextResponse.json({ error: "画像が生成されませんでした" }, { status: 500 });
    }

    // Supabase Storage にアップロード
    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const ext = images[i].mimeType.includes("png") ? "png" : "jpg";
      const filename = `${user.id}/${Date.now()}_${i}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from("generations")
        .upload(filename, images[i].data, { contentType: images[i].mimeType });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(`ストレージへのアップロードに失敗: ${uploadError.message}`);
      }
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
      model: "gemini-3.1-flash-image-preview",
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      generation_type: "generate",
      processing_time_ms: processingTime,
    });

    return NextResponse.json({ images: uploadedUrls, processingTime });
  } catch (error) {
    console.error("Banner generation error:", error);
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "API利用上限に達しました。しばらく待ってから再試行してください。" },
        { status: 429 }
      );
    }
    if (msg.includes("SAFETY") || msg.includes("safety")) {
      return NextResponse.json(
        { error: "プロンプトがAIの安全フィルターに引っかかりました。別の内容で試してください。" },
        { status: 422 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "無効なパラメータです", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: `画像生成に失敗しました: ${msg.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
