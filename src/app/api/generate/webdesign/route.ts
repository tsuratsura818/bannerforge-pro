import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SITE_TYPE_LABELS: Record<string, string> = {
  lp: "ランディングページ（LP）",
  corporate: "コーポレートサイト",
  ec: "ECサイト・ショッピングサイト",
  portfolio: "ポートフォリオ・作品紹介サイト",
  saas: "SaaS・プロダクト紹介サイト",
  blog: "ブログ・メディアサイト",
};

const STYLE_LABELS: Record<string, string> = {
  minimal: "ミニマル・シンプル（余白多め、細いフォント）",
  modern: "モダン・洗練（グラデーション、カード型レイアウト）",
  bold: "ボールド・インパクト（大きい文字、強いコントラスト）",
  dark: "ダーク・プレミアム（黒背景、光るアクセント）",
  creative: "クリエイティブ・個性的（非対称レイアウト、豊かな表現）",
  clean: "クリーン・ビジネス（整然、信頼感、プロフェッショナル）",
};

const SECTION_LABELS: Record<string, string> = {
  nav: "ナビゲーションバー",
  hero: "ヒーローセクション（メインビジュアル）",
  features: "特徴・機能紹介",
  stats: "実績・数字",
  pricing: "料金プラン",
  testimonials: "お客様の声",
  faq: "よくある質問",
  team: "チーム・メンバー紹介",
  contact: "お問い合わせフォーム",
  footer: "フッター",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, siteType, style, primaryColor, sections } = await request.json() as {
      prompt: string;
      siteType: string;
      style: string;
      primaryColor: string;
      sections: string[];
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "プロンプトが必要です" }, { status: 400 });
    }

    const sectionList = sections.map(s => `- ${SECTION_LABELS[s] ?? s}`).join("\n");
    const siteLabel = SITE_TYPE_LABELS[siteType] ?? siteType;
    const styleLabel = STYLE_LABELS[style] ?? style;

    const systemPrompt = `You are an expert web designer and frontend developer specializing in modern, professional Japanese websites.

Generate a complete, self-contained HTML page with the following specifications:

## サイト概要
- タイプ: ${siteLabel}
- コンセプト: ${prompt}

## デザインスタイル
${styleLabel}

## カラーテーマ
- プライマリカラー: ${primaryColor}
- このカラーをアクセントとして効果的に使用してください

## 含めるセクション（上から順番に）
${sectionList}

## 技術要件
- 完全な HTML5 ドキュメント（<!DOCTYPE html> から </html> まで）
- Tailwind CSS CDN を使用: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts を CDN で読み込む（デザインに合ったフォントを選択）
- 外部画像は使用しない（CSS グラデーション・SVG・絵文字で代用）
- 完全レスポンシブ対応（モバイルファースト）
- スムーズスクロール（scroll-behavior: smooth）
- ホバーアニメーション（transition / transform）
- すべてのテキストは日本語
- コンテンツはコンセプトに合ったリアルな仮テキストを入れる
- フォームは見た目のみ（実際の送信機能不要）
- プライマリカラーは Tailwind の inline style または custom color で適用

## 出力形式
HTMLコードのみ出力してください。<!DOCTYPE html> で始まり </html> で終わること。
説明文、マークダウンのコードブロック（\`\`\`）は絶対に含めないこと。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    let html = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // マークダウンコードブロックを除去
    html = html.replace(/^```[\w]*\n?/m, "").replace(/\n?```\s*$/m, "").trim();

    // <!DOCTYPE html> より前のテキストを除去
    const doctypeIdx = html.indexOf("<!DOCTYPE");
    if (doctypeIdx > 0) html = html.slice(doctypeIdx);
    const doctypeLower = html.toLowerCase().indexOf("<!doctype");
    if (doctypeLower > 0) html = html.slice(doctypeLower);

    if (!html.toLowerCase().includes("<!doctype")) {
      throw new Error("有効なHTMLが生成されませんでした。再度お試しください。");
    }

    const usage = {
      inputTokens:  response.usageMetadata?.promptTokenCount     ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens:  response.usageMetadata?.totalTokenCount      ?? 0,
    };

    return NextResponse.json({ html, usage });
  } catch (error) {
    console.error("Web design generation error:", error);
    const msg = error instanceof Error ? error.message : "生成に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
