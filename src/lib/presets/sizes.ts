export interface SizePreset {
  key: string;
  platform: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
}

export const SIZE_PRESETS: Record<string, SizePreset[]> = {
  instagram: [
    { key: "feed-square", platform: "instagram", label: "フィード (正方形)", width: 1080, height: 1080, ratio: "1:1" },
    { key: "feed-portrait", platform: "instagram", label: "フィード (縦型)", width: 1080, height: 1350, ratio: "4:5" },
    { key: "story", platform: "instagram", label: "ストーリーズ", width: 1080, height: 1920, ratio: "9:16" },
    { key: "reel", platform: "instagram", label: "リール", width: 1080, height: 1920, ratio: "9:16" },
  ],
  x: [
    { key: "post", platform: "x", label: "投稿画像", width: 1200, height: 675, ratio: "16:9" },
    { key: "header", platform: "x", label: "ヘッダー", width: 1500, height: 500, ratio: "3:1" },
    { key: "card", platform: "x", label: "カード画像", width: 800, height: 418, ratio: "16:9" },
  ],
  tiktok: [
    { key: "video", platform: "tiktok", label: "動画サムネイル", width: 1080, height: 1920, ratio: "9:16" },
    { key: "ad", platform: "tiktok", label: "広告バナー", width: 1080, height: 1080, ratio: "1:1" },
  ],
  youtube: [
    { key: "thumbnail", platform: "youtube", label: "サムネイル", width: 1280, height: 720, ratio: "16:9" },
    { key: "banner", platform: "youtube", label: "チャンネルバナー", width: 2560, height: 1440, ratio: "16:9" },
    { key: "short", platform: "youtube", label: "Shorts", width: 1080, height: 1920, ratio: "9:16" },
  ],
  facebook: [
    { key: "post", platform: "facebook", label: "投稿画像", width: 1200, height: 630, ratio: "16:9" },
    { key: "story", platform: "facebook", label: "ストーリーズ", width: 1080, height: 1920, ratio: "9:16" },
    { key: "cover", platform: "facebook", label: "カバー写真", width: 820, height: 312, ratio: "5:2" },
    { key: "ad", platform: "facebook", label: "広告バナー", width: 1200, height: 628, ratio: "16:9" },
  ],
  line: [
    { key: "rich-message", platform: "line", label: "リッチメッセージ", width: 1040, height: 1040, ratio: "1:1" },
    { key: "card-msg", platform: "line", label: "カードタイプメッセージ", width: 1024, height: 1024, ratio: "1:1" },
    { key: "banner", platform: "line", label: "バナー", width: 1024, height: 576, ratio: "16:9" },
  ],
  amazon: [
    { key: "main", platform: "amazon", label: "メイン画像", width: 2000, height: 2000, ratio: "1:1" },
    { key: "sub", platform: "amazon", label: "サブ画像", width: 1000, height: 1000, ratio: "1:1" },
    { key: "a-plus", platform: "amazon", label: "A+コンテンツ", width: 970, height: 300, ratio: "97:30" },
  ],
  rakuten: [
    { key: "main", platform: "rakuten", label: "メイン画像", width: 700, height: 700, ratio: "1:1" },
    { key: "banner-wide", platform: "rakuten", label: "ワイドバナー", width: 1456, height: 180, ratio: "81:10" },
  ],
  zozotown: [
    { key: "product", platform: "zozotown", label: "商品画像", width: 1000, height: 1250, ratio: "4:5" },
    { key: "lookbook", platform: "zozotown", label: "ルックブック", width: 1000, height: 1000, ratio: "1:1" },
  ],
  shopify: [
    { key: "product", platform: "shopify", label: "商品画像", width: 2048, height: 2048, ratio: "1:1" },
    { key: "collection", platform: "shopify", label: "コレクション", width: 1200, height: 628, ratio: "16:9" },
    { key: "banner", platform: "shopify", label: "バナー", width: 1920, height: 600, ratio: "16:5" },
  ],
  base: [
    { key: "product", platform: "base", label: "商品画像", width: 1000, height: 1000, ratio: "1:1" },
    { key: "banner", platform: "base", label: "バナー", width: 1280, height: 640, ratio: "2:1" },
  ],
};

export function getAllPresets(): SizePreset[] {
  return Object.values(SIZE_PRESETS).flat();
}

export function getPresetsByPlatform(platform: string): SizePreset[] {
  return SIZE_PRESETS[platform] ?? [];
}

export function getPresetByKey(platform: string, key: string): SizePreset | undefined {
  return SIZE_PRESETS[platform]?.find((p) => p.key === key);
}
