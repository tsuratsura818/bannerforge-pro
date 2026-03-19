import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // multipart/form-data で商品画像も受け取る
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const aspectRatio = (formData.get("aspectRatio") as string) ?? "1:1";
    const resolution = (formData.get("resolution") as string) ?? "1K";
    const style = formData.get("style") as string | null;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "プロンプトが必要です" }, { status: 400 });
    }

    // 商品画像をBufferに変換
    const productImages: { data: Buffer; mimeType: string }[] = [];
    const files = formData.getAll("productImages") as File[];
    for (const file of files) {
      if (file.size > 0) {
        productImages.push({
          data: Buffer.from(await file.arrayBuffer()),
          mimeType: file.type || "image/jpeg",
        });
      }
    }

    // Gemini（Nano Banana 2）で画像生成
    const images = await generateImage({
      prompt,
      aspectRatio,
      resolution,
      referenceImages: productImages,
    });

    if (images.length === 0) {
      return NextResponse.json({ error: "画像が生成されませんでした" }, { status: 500 });
    }

    // Supabase Storage にアップロード（service role でRLSバイパス）
    const admin = createAdminClient();
    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const ext = images[i].mimeType.includes("png") ? "png" : "jpg";
      const filename = `${user.id}/${Date.now()}_${i}.${ext}`;
      const { data, error: uploadError } = await admin.storage
        .from("generations")
        .upload(filename, images[i].data, { contentType: images[i].mimeType });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(`ストレージへのアップロードに失敗: ${uploadError.message}`);
      }
      if (data) {
        const { data: urlData } = admin.storage
          .from("generations")
          .getPublicUrl(filename);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const processingTime = Date.now() - startTime;

    await supabase.from("generations").insert({
      user_id: user.id,
      prompt,
      params: { style, aspectRatio, resolution, hasProductImage: productImages.length > 0 },
      output_images: uploadedUrls,
      model: "gemini-3.1-flash-image-preview",
      resolution,
      aspect_ratio: aspectRatio,
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
    return NextResponse.json(
      { error: `画像生成に失敗しました: ${msg.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
