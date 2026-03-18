export interface TemplateDefinition {
  id: string;
  name: string;
  category: "banner" | "product" | "ad" | "social" | "ec" | "event";
  description: string;
  promptTemplate: string;
  defaultParams: {
    style?: string;
    aspectRatio?: string;
    resolution?: string;
  };
}

export const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
  {
    id: "sns-sale-banner",
    name: "セールバナー (SNS)",
    category: "banner",
    description: "SNS向けセール告知バナー",
    promptTemplate: "「{catchcopy}」のセールバナーを作成してください。割引率や期間を強調したポップなデザイン。",
    defaultParams: { style: "pop", aspectRatio: "1:1", resolution: "1K" },
  },
  {
    id: "ec-product-white",
    name: "EC白背景商品画像",
    category: "ec",
    description: "Amazon・楽天向け白背景商品画像",
    promptTemplate: "「{productName}」の商品画像。純白背景、商品が中央85%占有、プロ撮影品質。",
    defaultParams: { aspectRatio: "1:1", resolution: "2K" },
  },
  {
    id: "instagram-story",
    name: "Instagramストーリーズ",
    category: "social",
    description: "Instagram Stories向けバナー",
    promptTemplate: "「{catchcopy}」のInstagramストーリーズ用縦型バナー。スワイプを誘う魅力的なデザイン。",
    defaultParams: { style: "pop", aspectRatio: "9:16", resolution: "1K" },
  },
  {
    id: "youtube-thumbnail",
    name: "YouTubeサムネイル",
    category: "banner",
    description: "YouTube動画サムネイル",
    promptTemplate: "「{title}」のYouTubeサムネイル。クリックを誘う目立つデザイン、大きいテキスト。",
    defaultParams: { style: "pop", aspectRatio: "16:9", resolution: "1K" },
  },
  {
    id: "event-flyer",
    name: "イベントフライヤー",
    category: "event",
    description: "イベント告知フライヤー",
    promptTemplate: "「{eventName}」のイベントフライヤー。日時: {datetime}。参加者を惹きつけるデザイン。",
    defaultParams: { style: "corporate", aspectRatio: "3:4", resolution: "2K" },
  },
  {
    id: "luxury-brand",
    name: "高級ブランド広告",
    category: "ad",
    description: "プレミアム・ラグジュアリーブランド向け",
    promptTemplate: "「{productName}」の高級感あるブランド広告。{catchcopy}。洗練されたラグジュアリーデザイン。",
    defaultParams: { style: "luxury", aspectRatio: "1:1", resolution: "2K" },
  },
];
