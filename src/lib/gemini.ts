import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODELS = {
  fast: "gemini-2.0-flash-exp",
  quality: "gemini-2.0-flash-exp",
} as const;

type ModelType = keyof typeof MODELS;

interface GenerateImageParams {
  prompt: string;
  aspectRatio?: string;
  resolution?: string;
  model?: ModelType;
  referenceImages?: { data: Buffer; mimeType: string }[];
}

interface GeneratedImage {
  data: Buffer;
  mimeType: string;
}

export async function generateImage(
  params: GenerateImageParams
): Promise<GeneratedImage[]> {
  const {
    prompt,
    aspectRatio = "1:1",
    resolution = "1K",
    model = "fast",
    referenceImages = [],
  } = params;

  const contents: { inlineData?: { data: string; mimeType: string }; text?: string }[] = [];

  for (const img of referenceImages) {
    contents.push({
      inlineData: {
        data: img.data.toString("base64"),
        mimeType: img.mimeType,
      },
    });
  }

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODELS[model],
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize: resolution,
      },
    },
  } as Parameters<typeof ai.models.generateContent>[0]);

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
      "この画像の背景を完全に除去してください。" +
      "対象物のエッジを正確に保持し、背景を透明（透過）にしてください。",
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
      `この画像の背景を以下に変更してください: ${newBackground}。` +
      "対象物のエッジは正確に保持し、新しい背景と自然に馴染むようにしてください。",
    referenceImages: [{ data: imageBuffer, mimeType }],
  });
}

export async function whiteBackground(
  imageBuffer: Buffer,
  mimeType: string
): Promise<GeneratedImage[]> {
  return generateImage({
    prompt:
      "この商品写真の背景を純白（#FFFFFF）に変更してください。" +
      "商品の輪郭は鮮明に保ち、自然な薄いドロップシャドウを追加してください。" +
      "商品が中央に配置されるようにしてください。",
    referenceImages: [{ data: imageBuffer, mimeType }],
  });
}
