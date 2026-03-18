import { NextResponse } from "next/server";
import { BUILT_IN_TEMPLATES } from "@/lib/prompts/templates";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userTemplates = user
      ? await supabase
          .from("templates")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : { data: [] };

    return NextResponse.json({
      builtIn: BUILT_IN_TEMPLATES,
      user: userTemplates.data ?? [],
    });
  } catch (error) {
    console.error("Templates error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
