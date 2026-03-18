import { NextResponse } from "next/server";
import { removeBackground, replaceBackground, whiteBackground } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const mode = formData.get("mode") as string ?? "transparent";
    const background = formData.get("background") as string ?? "";

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const mimeType = imageFile.type;

    let results;
    if (mode === "white") {
      results = await whiteBackground(buffer, mimeType);
    } else if (mode === "custom" && background) {
      results = await replaceBackground(buffer, mimeType, background);
    } else {
      results = await removeBackground(buffer, mimeType);
    }

    if (results.length === 0) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    const filename = `${user.id}/${Date.now()}_remove-bg.png`;
    const { data } = await supabase.storage
      .from("generations")
      .upload(filename, results[0].data, { contentType: results[0].mimeType });

    if (!data) {
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("generations").getPublicUrl(filename);

    await supabase.from("generations").insert({
      user_id: user.id,
      prompt: `背景除去 (mode: ${mode})`,
      params: { mode, background },
      output_images: [urlData.publicUrl],
      model: "gemini-2.0-flash-exp",
      generation_type: "remove-bg",
    });

    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error("Remove background error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Gemini APIの利用上限に達しました。Google AI Studioで課金を有効にしてください。" },
        { status: 429 }
      );
    }
    if (msg.includes("SAFETY") || msg.includes("safety")) {
      return NextResponse.json(
        { error: "画像がAIの安全フィルターに引っかかりました。別の画像をお試しください。" },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "背景除去に失敗しました。しばらくしてから再試行してください。" }, { status: 500 });
  }
}
