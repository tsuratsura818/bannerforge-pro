import { NextResponse } from "next/server";
import { replaceBackground } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const newBg = formData.get("background") as string;

    if (!imageFile || !newBg) {
      return NextResponse.json({ error: "Missing image or background" }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const results = await replaceBackground(buffer, imageFile.type, newBg);

    if (results.length === 0) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    const filename = `${user.id}/${Date.now()}_replace-bg.png`;
    await admin.storage
      .from("generations")
      .upload(filename, results[0].data, { contentType: results[0].mimeType });

    const { data: urlData } = admin.storage.from("generations").getPublicUrl(filename);
    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error("Replace background error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
