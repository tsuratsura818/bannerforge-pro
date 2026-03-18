import type { BannerStyle } from "@/types/generation";

interface BannerPromptParams {
  catchcopy: string;
  subText?: string;
  style: BannerStyle;
  platform?: string;
  colors?: string[];
  additionalInstructions?: string;
}

const STYLE_DESCRIPTIONS: Record<BannerStyle, string> = {
  simple: "シンプルでクリーンなデザイン。余白を活かし、読みやすいレイアウト。",
  pop: "明るくポップなデザイン。鮮やかな色彩と元気なタイポグラフィ。視線を引くダイナミックなレイアウト。",
  luxury: "高級感・上品さを演出するラグジュアリーデザイン。ゴールドやシルバーのアクセント。洗練されたタイポグラフィ。",
  japanese: "和のテイストを取り入れた日本的デザイン。墨、朱、金など伝統的な色彩。和紙や筆文字のテクスチャ。",
  neon: "ネオン・サイバーパンク風のデザイン。暗い背景に蛍光色の発光エフェクト。未来的なビジュアル。",
  minimal: "ミニマリストなデザイン。最小限の要素で最大のインパクト。モノクロまたは限定的な色使い。",
  corporate: "プロフェッショナルなビジネス向けデザイン。信頼感・安定感を演出。落ち着いた色調。",
};

export function buildBannerPrompt(params: BannerPromptParams): string {
  const { catchcopy, subText, style, platform, colors, additionalInstructions } = params;

  const parts: string[] = [];

  parts.push(`以下の内容でバナー画像を作成してください。`);
  parts.push(`メインコピー: 「${catchcopy}」`);

  if (subText) {
    parts.push(`サブテキスト: 「${subText}」`);
  }

  parts.push(`デザインスタイル: ${STYLE_DESCRIPTIONS[style]}`);

  if (platform) {
    parts.push(`掲載プラットフォーム: ${platform}`);
  }

  if (colors && colors.length > 0) {
    parts.push(`使用カラー: ${colors.join(", ")}`);
  }

  parts.push("テキストは画像内に明確に配置し、読みやすいフォントを使用してください。");
  parts.push("プロフェッショナルなクオリティで仕上げてください。");

  if (additionalInstructions) {
    parts.push(additionalInstructions);
  }

  return parts.join("\n");
}
