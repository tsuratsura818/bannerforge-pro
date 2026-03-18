import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// 生成はクライアントサイド(Pollinations.ai直接)で行い、このルートは履歴保存のみ
const RequestSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().min(1),
  aspectRatio: z.string().default("1:1"),
  resolution: z.string().default("1K"),
  style: z.string().optional(),
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

    await supabase.from("generations").insert({
      user_id: user.id,
      prompt: params.prompt,
      params: { style: params.style, aspectRatio: params.aspectRatio, resolution: params.resolution },
      output_images: [params.imageUrl],
      model: "FLUX.1 via Pollinations.ai",
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      generation_type: "generate",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    console.error("History save error:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}
