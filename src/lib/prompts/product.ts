interface ProductPromptParams {
  productName: string;
  description?: string;
  targetPlatform: "amazon" | "rakuten" | "shopify" | "base" | "zozotown" | "generic";
  backgroundType: "white" | "remove" | "lifestyle" | "custom";
  customBackground?: string;
  additionalInstructions?: string;
}

const PLATFORM_RULES: Record<ProductPromptParams["targetPlatform"], string> = {
  amazon: "Amazon商品画像規格: 純白背景(#FFFFFF)、商品が画像の85%を占める",
  rakuten: "楽天商品画像規格: 正方形フォーマット、白背景推奨",
  shopify: "Shopify商品画像: クリーンな背景、高品質",
  base: "BASE商品画像: 正方形フォーマット、シンプルな背景",
  zozotown: "ZOZOTOWN商品画像: ファッション撮影スタイル",
  generic: "ECサイト汎用商品画像",
};

export function buildProductPrompt(params: ProductPromptParams): string {
  const parts: string[] = [];

  parts.push(`「${params.productName}」の商品画像を作成してください。`);

  if (params.description) {
    parts.push(`商品説明: ${params.description}`);
  }

  parts.push(PLATFORM_RULES[params.targetPlatform]);

  switch (params.backgroundType) {
    case "white":
      parts.push("背景を純白(#FFFFFF)にしてください。商品は中央に配置し、自然な影を追加。");
      break;
    case "remove":
      parts.push("背景を完全に除去し、透明にしてください。");
      break;
    case "lifestyle":
      parts.push("商品の使用シーンを想起させるライフスタイル背景を使用してください。");
      break;
    case "custom":
      if (params.customBackground) {
        parts.push(`背景: ${params.customBackground}`);
      }
      break;
  }

  parts.push("プロフェッショナルな商品撮影品質で仕上げてください。");

  if (params.additionalInstructions) {
    parts.push(params.additionalInstructions);
  }

  return parts.join("\n");
}
