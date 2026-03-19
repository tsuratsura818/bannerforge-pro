import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

interface GenerateImageParams {
  prompt: string;
  aspectRatio?: string;
  resolution?: string;
  referenceImages?: { data: Buffer; mimeType: string }[];
}

interface GeneratedImage {
  data: Buffer;
  mimeType: string;
}

// ImageConfig でサポートされているアスペクト比に変換
function normalizeAspectRatio(ratio: string): string {
  const supported = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
  if (supported.includes(ratio)) return ratio;
  // 非サポート比（4:5, 5:4 等）は最も近い値に変換
  const map: Record<string, string> = {
    "4:5": "3:4",
    "5:4": "4:3",
  };
  return map[ratio] ?? "1:1";
}

export async function generateImage(
  params: GenerateImageParams
): Promise<GeneratedImage[]> {
  const {
    prompt,
    aspectRatio = "1:1",
    resolution = "1K",
    referenceImages = [],
  } = params;

  const isTextToImage = referenceImages.length === 0;

  // 商品画像がある場合：商品をバナーに自然に配置するよう明示的に指示
  const compositePrompt =
    referenceImages.length > 0
      ? [
          `以下の商品画像を使って、プロフェッショナルな広告バナーを生成してください。`,
          `商品を画像の中に自然に配置し、商品が主役になるようにレイアウトしてください。`,
          `背景・照明・影はバナーのコンセプトに合わせて自動生成してください。`,
          ``,
          `【バナーのコンセプト】`,
          prompt,
        ].join("\n")
      : prompt;

  const contents =
    referenceImages.length > 0
      ? [
          {
            role: "user" as const,
            parts: [
              ...referenceImages.map((img) => ({
                inlineData: {
                  data: img.data.toString("base64"),
                  mimeType: img.mimeType,
                },
              })),
              { text: compositePrompt },
            ],
          },
        ]
      : prompt;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    responseModalities: ["IMAGE"],
  };

  if (isTextToImage) {
    config.imageConfig = {
      aspectRatio: normalizeAspectRatio(aspectRatio),
      imageSize: resolution === "512" ? "1K" : resolution, // 512は1Kにフォールバック
    };
  }

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: contents as Parameters<typeof ai.models.generateContent>[0]["contents"],
    config,
  });

  const images: GeneratedImage[] = [];
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      images.push({
        data: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType ?? "image/jpeg",
      });
    }
  }
  return images;
}

export async function removeBackground(
  imageBuffer: Buffer,
  mimeType: string
): Promise<GeneratedImage[]> {
  return generateImage({
    prompt:
      "Remove the background from this image completely. " +
      "Keep the subject's edges precise and make the background fully transparent.",
    referenceImages: [{ data: imageBuffer, mimeType }],
  });
}

export async function replaceBackground(
  imageBuffer: Buffer,
  mimeType: string,
  newBackground: string
): Promise<GeneratedImage[]> {
  return generateImage({
    prompt:
      `Replace the background of this image with: ${newBackground}. ` +
      "Keep the subject's edges precise and blend naturally with the new background.",
    referenceImages: [{ data: imageBuffer, mimeType }],
  });
}

export async function whiteBackground(
  imageBuffer: Buffer,
  mimeType: string
): Promise<GeneratedImage[]> {
  return generateImage({
    prompt:
      "Change the background of this product photo to pure white (#FFFFFF). " +
      "Keep the product outline sharp, add a subtle drop shadow, and center the product.",
    referenceImages: [{ data: imageBuffer, mimeType }],
  });
}
