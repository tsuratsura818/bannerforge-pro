import { NextResponse } from "next/server";
import { getAllPresets } from "@/lib/presets/sizes";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const systemPresets = getAllPresets();

    const userPresets = user
      ? await supabase
          .from("size_presets")
          .select("*")
          .eq("user_id", user.id)
      : { data: [] };

    return NextResponse.json({
      system: systemPresets,
      user: userPresets.data ?? [],
    });
  } catch (error) {
    console.error("Presets error:", error);
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}
