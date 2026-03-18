import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { resizeImage } from "@/lib/image-processing";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  sizes: z.array(
    z.object({
      width: z.number(),
      height: z.number(),
      label: z.string(),
    })
  ).min(1).max(10),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const params = RequestSchema.parse(body);

    const baseImages = await generateImage({ prompt: params.prompt, resolution: "2K" });
    if (baseImages.length === 0) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    const results: { label: string; url: string; width: number; height: number }[] = [];
    for (const size of params.sizes) {
      const resized = await resizeImage(baseImages[0].data, size.width, size.height);
      const filename = `${user.id}/${Date.now()}_${size.width}x${size.height}.png`;
      await supabase.storage
        .from("generations")
        .upload(filename, resized, { contentType: "image/png" });
      const { data: urlData } = supabase.storage.from("generations").getPublicUrl(filename);
      results.push({ label: size.label, url: urlData.publicUrl, width: size.width, height: size.height });
    }

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid parameters", details: error.issues }, { status: 400 });
    }
    console.error("Multi-size export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
