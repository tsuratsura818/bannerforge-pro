import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StitchToolClient } from "@google/stitch-sdk";
import { Stitch } from "@google/stitch-sdk";

export const maxDuration = 60;

// ── ラベルマップ ──────────────────────────────────────

const SITE_TYPE_LABELS: Record<string, string> = {
  lp:        "landing page (LP)",
  corporate: "corporate website",
  ec:        "e-commerce / shopping website",
  portfolio: "portfolio / work showcase site",
  saas:      "SaaS / product website",
  blog:      "blog / media website",
};

const STYLE_LABELS: Record<string, string> = {
  minimal:  "minimal and simple (lots of whitespace, thin fonts)",
  modern:   "modern and refined (gradients, card-based layout)",
  bold:     "bold and impactful (large text, strong contrast)",
  dark:     "dark and premium (dark background, glowing accents)",
  creative: "creative and unique (asymmetric layout, expressive)",
  clean:    "clean and business-like (structured, trustworthy, professional)",
};

const SECTION_LABELS: Record<string, string> = {
  nav:          "navigation bar",
  hero:         "hero section (main visual)",
  features:     "features / benefits section",
  stats:        "stats / achievements / numbers section",
  pricing:      "pricing plans section",
  testimonials: "customer testimonials / reviews",
  faq:          "FAQ section",
  team:         "team / member introduction",
  contact:      "contact form",
  footer:       "footer",
};

const ANIMATION_LABELS: Record<string, string> = {
  none:   "No animations. Purely static design.",
  subtle: "Subtle animations only: hover transitions, gentle fade-ins.",
  rich:   "Rich animations: scroll-triggered reveals, parallax effects, particle effects, loading animations.",
};

// ── ヘルパー ──────────────────────────────────────────

function buildStitchPrompt(params: {
  prompt: string;
  siteType: string;
  style: string;
  primaryColor: string;
  sections: string[];
  animation: string;
}): string {
  const { prompt, siteType, style, primaryColor, sections, animation } = params;
  const sectionList = sections.map(s => `- ${SECTION_LABELS[s] ?? s}`).join("\n");

  return `Create a complete, full-page Japanese ${SITE_TYPE_LABELS[siteType] ?? siteType} design.

Design style: ${STYLE_LABELS[style] ?? style}
Primary accent color: ${primaryColor}
Animation: ${ANIMATION_LABELS[animation] ?? animation}

Include these sections from top to bottom:
${sectionList}

Website concept (in Japanese content):
${prompt}

Requirements:
- All text content must be in Japanese
- Professional, polished visual design
- Realistic placeholder content appropriate for the concept
- Contact forms are decorative only (no actual submission needed)
- Full-page vertical layout showing all specified sections`;
}

// ── Route Handler ────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "STITCH_API_KEY が設定されていません。stitch.withgoogle.com でAPIキーを取得し、環境変数に設定してください。" },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, siteType, style, primaryColor, sections, animation } = await request.json() as {
      prompt: string;
      siteType: string;
      style: string;
      primaryColor: string;
      sections: string[];
      animation: "none" | "subtle" | "rich";
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "プロンプトが必要です" }, { status: 400 });
    }

    // Stitch クライアントを初期化してプロジェクト作成 → 画面生成
    const client = new StitchToolClient({ apiKey });
    const stitch = new Stitch(client);

    const project = await stitch.createProject("BannerForge Web Design");

    const stitchPrompt = buildStitchPrompt({ prompt, siteType, style, primaryColor, sections, animation });

    const screen = await project.generate(
      stitchPrompt,
      "DESKTOP",
      "GEMINI_3_FLASH"
    );

    // HTML と スクリーンショット URL を並列取得
    const [htmlUrl, imageUrl] = await Promise.all([
      screen.getHtml(),
      screen.getImage(),
    ]);

    // HTML は URL なので実際のコンテンツを取得
    const htmlRes = await fetch(htmlUrl);
    if (!htmlRes.ok) throw new Error("生成されたHTMLの取得に失敗しました");
    const html = await htmlRes.text();

    return NextResponse.json({ html, imageUrl });
  } catch (error) {
    console.error("Stitch web design generation error:", error);
    const msg = error instanceof Error ? error.message : "生成に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
