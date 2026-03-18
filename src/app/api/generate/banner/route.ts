import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
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

    // クォータチェック
    const { data: profile } = await supabase
      .from("profiles")
      .select("used_this_month, monthly_quota")
      .eq("id", user.id)
      .single();

    if (profile && profile.used_this_month >= profile.monthly_quota) {
      return NextResponse.json(
        { error: "月間クォータを超過しました。プランをアップグレードしてください。" },
        { status: 429 }
      );
    }

    const images = await generateImage({
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      resolution: params.resolution,
    });

    if (images.length === 0) {
      return NextResponse.json({ error: "画像が生成されませんでした" }, { status: 500 });
    }

    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const filename = `${user.id}/${Date.now()}_${i}.png`;
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

    // 生成履歴を保存
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

    // クォータを更新
    await supabase
      .from("profiles")
      .update({ used_this_month: (profile?.used_this_month ?? 0) + 1 })
      .eq("id", user.id);

    return NextResponse.json({
      images: uploadedUrls,
      processingTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid parameters", details: error.issues }, { status: 400 });
    }
    console.error("Banner generation error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Gemini APIの利用上限に達しました。Google AI Studioで課金を有効にしてください。" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "画像生成に失敗しました。プロンプトを変えて再試行してください。" }, { status: 500 });
  }
}
