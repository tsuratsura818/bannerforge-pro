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

// ── アニメーション詳細 ────────────────────────────────

const ANIMATION_DETAIL: Record<string, string> = {
  none: `No animations or transitions. Purely static design. Do not use any CSS animations, transitions, or JavaScript-based motion.`,

  subtle: `Apply these subtle animations:
- Smooth hover transitions on buttons and cards: transition: all 0.3s ease
- Navigation links: color/underline fade on hover
- Buttons: slight scale(1.03) + shadow deepening on hover
- Cards: translateY(-4px) + box-shadow on hover
- Section entrance: use a simple CSS class .fade-in with opacity 0→1 over 0.6s, triggered by adding class on scroll via IntersectionObserver
- Do NOT add particle effects, parallax, or heavy JavaScript`,

  rich: `Implement rich, polished animations using CSS @keyframes and IntersectionObserver:

1. Hero section:
   - Heading: text slides up from translateY(40px) opacity:0 → translateY(0) opacity:1 over 0.8s ease-out (delay 0.1s)
   - Subheading: same, delay 0.3s
   - CTA button: fadeIn + scaleUp from scale(0.9), delay 0.5s
   - Hero background image: subtle Ken Burns effect — scale(1.0)→scale(1.08) over 12s ease-in-out infinite

2. Scroll-triggered section reveals (IntersectionObserver, threshold:0.15):
   - Cards/feature items: staggered translateY(30px)→0 + opacity 0→1, each card 0.15s apart
   - Stats/numbers: count-up animation using JavaScript (0 → final value over 1.5s ease-out)
   - Testimonial cards: fadeInUp with 0.2s stagger

3. Hover interactions:
   - Buttons: scale(1.05), box-shadow deepening, background gradient shift — transition 0.25s
   - Cards: translateY(-8px) + elevated shadow — transition 0.3s cubic-bezier(0.25,0.46,0.45,0.94)
   - Nav links: underline slide-in from left using ::after pseudo-element

4. Background effects (if dark or creative style):
   - Floating particles: 6–8 small circles (4–8px, opacity 0.15–0.3) with random float animation
   - Gradient orbs: 2–3 large blurred circles with slow drift animation

5. Use @keyframes for: fadeInUp, slideInLeft, slideInRight, scaleIn, float, countUp`,
};

// ── サイトタイプ別ガイド ────────────────────────────────

const SITE_TYPE_GUIDE: Record<string, string> = {
  lp: `LP-specific layout rules:
- Single long scroll page, strong above-the-fold hero with headline + subheadline + large CTA button
- Benefits section: 3-column icon cards
- Social proof: testimonial grid or carousel layout
- Pricing: highlight recommended plan with a badge
- Final CTA section before footer: bold background-color block with headline + button`,

  corporate: `Corporate site layout rules:
- Professional nav with logo left, links center/right, CTA button
- Hero: split layout (text left, image/video right) or full-width with overlay text
- Services/features: 3-column cards with icons
- About/stats bar: full-width dark background with 4 key numbers
- Team section: circular avatar photos in a grid`,

  ec: `E-commerce layout rules:
- Hero: full-width banner with product lifestyle photo, overlay text + shop button
- Product grid: 3-4 column card layout, each with product photo, name, price
- Featured products: horizontal scroll or grid highlight section
- Category navigation: horizontal pill/badge buttons
- Trust badges: secure payment, free shipping, return policy icons`,

  portfolio: `Portfolio layout rules:
- Dramatic hero: large name/title, short bio, background is blurred or darkened project photo
- Work grid: masonry or 2-3 column layout with project thumbnail images
- Each work card: image fills card, title + category overlay on hover
- Skills section: tag cloud or horizontal list with proficiency bars
- About: split layout with photo and bio text`,

  saas: `SaaS site layout rules:
- Hero: centered headline (problem→solution), product screenshot/mockup below, 2 CTA buttons (trial + demo)
- Feature sections: alternating left/right layout (text + screenshot side by side)
- Social proof: logo bar of client companies
- Pricing: 3-tier card layout, middle card highlighted as "most popular"
- Integration logos or tech stack icons`,

  blog: `Blog/media layout rules:
- Header: logo + category nav + search
- Hero: featured article with large image, title overlay
- Article grid: 3-column card layout (thumbnail + category tag + title + excerpt + author + date)
- Sidebar: popular posts, category list, newsletter signup
- Newsletter CTA section: full-width colored block`,
};

// ── 写真・画像使用ガイド ───────────────────────────────

function buildImageGuide(siteType: string, style: string): string {
  const isDark = style === "dark";
  const overlay = isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)";

  const heroImage = `https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80`;

  const categoryImages: Record<string, string[]> = {
    lp:        [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    ],
    corporate: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
    ],
    ec:        [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
      "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&q=80",
      "https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=600&q=80",
    ],
    saas:      [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80",
    ],
    blog:      [
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    ],
  };

  const teamPhotos = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
  ];

  const imgs = categoryImages[siteType] ?? categoryImages.corporate;

  return `CRITICAL — Image usage rules (you MUST follow these):
- Use real <img> tags with actual src URLs — do NOT use colored div placeholders
- Hero background: use CSS background-image: url('${imgs[0]}') with background-size:cover background-position:center, overlaid with a gradient: linear-gradient(${overlay}, ${overlay})
- Section images: use <img src="${imgs[1]}" style="width:100%;height:280px;object-fit:cover;border-radius:12px">
- Card/feature images: use <img src="${imgs[2]}" style="width:100%;height:200px;object-fit:cover">
- Team member photos: circular <img> tags — src="${teamPhotos[0]}", "${teamPhotos[1]}", "${teamPhotos[2]}", "${teamPhotos[3]}" with border-radius:50% width:80px height:80px object-fit:cover
- Testimonial avatars: use Unsplash face photos (e.g. https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80) sized 48×48px, border-radius:50%
- Decorative background: for non-hero sections, consider a subtle background image with very low opacity (0.04–0.08) as a texture
- NEVER leave any image slot as a solid-color div — always use a real photo URL
- Fallback hero image if unsure: url('${heroImage}')`;
}

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

  const isDark = style === "dark";
  const bgColor    = isDark ? "#0a0a0f"  : "#ffffff";
  const textColor  = isDark ? "#f0f0f5"  : "#1a1a2e";
  const cardBg     = isDark ? "#16161f"  : "#f8f9fc";
  const borderColor = isDark ? "#2a2a3a" : "#e5e7eb";

  return `You are an expert web designer. Create a STUNNING, production-quality, full-page Japanese ${SITE_TYPE_LABELS[siteType] ?? siteType}.

═══ DESIGN SPECIFICATION ═══
Style: ${STYLE_LABELS[style] ?? style}
Primary accent color: ${primaryColor}
Background: ${bgColor} | Text: ${textColor} | Cards: ${cardBg} | Borders: ${borderColor}

═══ SECTIONS (top to bottom) ═══
${sectionList}

═══ WEBSITE CONCEPT ═══
${prompt}

═══ PHOTO & IMAGE REQUIREMENTS ═══
${buildImageGuide(siteType, style)}

═══ ANIMATION & INTERACTION ═══
${ANIMATION_DETAIL[animation] ?? ANIMATION_DETAIL.subtle}

═══ SITE-TYPE LAYOUT GUIDE ═══
${SITE_TYPE_GUIDE[siteType] ?? ""}

═══ TYPOGRAPHY ═══
- Import Google Fonts: Noto Sans JP (300,400,700) for Japanese text, Inter (400,600,700) for UI elements
- Hero headline: 56–72px font-weight:700 line-height:1.15
- Section headlines: 36–44px font-weight:700
- Body text: 16–18px font-weight:400 line-height:1.75
- Use letter-spacing: -0.02em on large headings

═══ QUALITY REQUIREMENTS ═══
- All text content in Japanese (placeholder text should be realistic and relevant to the concept)
- Pixel-perfect spacing: section padding 100–120px vertical, card gaps 24–32px
- Use CSS Grid and Flexbox — no table-based layout
- Buttons: rounded-full (border-radius:9999px) with padding 14px 32px, font-weight:600
- Primary button: background ${primaryColor}, white text, with hover state
- Ghost button: transparent with ${primaryColor} border, ${primaryColor} text
- Box shadows: use layered shadows like "0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -2px rgba(0,0,0,.05)"
- Include a complete <style> block with all CSS — no external CSS frameworks
- Single self-contained HTML file
- Contact forms are decorative (no actual submission)`;
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
      "GEMINI_3_PRO"
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
