import { NextResponse } from "next/server";
import { cropImage } from "@/lib/image-processing";
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
    const x = Number(formData.get("x") ?? 0);
    const y = Number(formData.get("y") ?? 0);
    const width = Number(formData.get("width") ?? 100);
    const height = Number(formData.get("height") ?? 100);

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const cropped = await cropImage(buffer, x, y, width, height);

    const filename = `${user.id}/${Date.now()}_crop.png`;
    await admin.storage
      .from("generations")
      .upload(filename, cropped, { contentType: "image/png" });

    const { data: urlData } = admin.storage.from("generations").getPublicUrl(filename);
    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error("Crop error:", error);
    return NextResponse.json({ error: "Crop failed" }, { status: 500 });
  }
}
