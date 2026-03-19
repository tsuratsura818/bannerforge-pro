import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const RequestSchema = z.object({
  originalPrompt: z.string().min(1).max(2000),
  count: z.number().min(1).max(4).default(2),
  aspectRatio: z.string().default("1:1"),
  resolution: z.string().default("1K"),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const params = RequestSchema.parse(body);

    const variationPrompts = [
      `${params.originalPrompt} バリエーション1: 配色を変えて`,
      `${params.originalPrompt} バリエーション2: レイアウトを変えて`,
    ].slice(0, params.count);

    const results = await Promise.all(
      variationPrompts.map((prompt) =>
        generateImage({ prompt, aspectRatio: params.aspectRatio, resolution: params.resolution })
      )
    );

    const allImages: string[] = [];
    for (const images of results) {
      for (let i = 0; i < images.length; i++) {
        const filename = `${user.id}/${Date.now()}_var_${i}.png`;
        const { data } = await admin.storage
          .from("generations")
          .upload(filename, images[i].data, { contentType: images[i].mimeType });
        if (data) {
          const { data: urlData } = admin.storage
            .from("generations")
            .getPublicUrl(filename);
          allImages.push(urlData.publicUrl);
        }
      }
    }

    return NextResponse.json({ images: allImages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid parameters", details: error.issues }, { status: 400 });
    }
    console.error("Variation generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
