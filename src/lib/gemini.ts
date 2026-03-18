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

export async function generateImage(
  params: GenerateImageParams
): Promise<GeneratedImage[]> {
  const { prompt, aspectRatio = "1:1", resolution = "1K", referenceImages = [] } = params;

  // 参照画像がある場合：Content配列（role+parts形式）
  // 参照画像がない場合：シンプルな文字列プロンプト
  const contents =
    referenceImages.length > 0
      ? [
          {
            role: "user",
            parts: [
              ...referenceImages.map((img) => ({
                inlineData: {
                  data: img.data.toString("base64"),
                  mimeType: img.mimeType,
                },
              })),
              { text: prompt },
            ],
          },
        ]
      : prompt;

  const config: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  // テキスト→画像生成時のみ imageConfig を付与
  if (referenceImages.length === 0) {
    config.imageConfig = { aspectRatio, imageSize: resolution };
  }

  const response = await (ai.models.generateContent as Function)({
    model: IMAGE_MODEL,
    contents,
    config,
  });

  const images: GeneratedImage[] = [];
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      images.push({
        data: Buffer.from(part.inlineData.data!, "base64"),
        mimeType: part.inlineData.mimeType!,
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
