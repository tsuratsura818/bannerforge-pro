import { HfInference } from "@huggingface/inference";

// HF_TOKENが未設定でも無料枠でアクセス可能（レート制限あり）
const hf = new HfInference(process.env.HF_TOKEN ?? "");

// 無料で使える高品質モデル
const IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";

interface GeneratedImage {
  data: Buffer;
  mimeType: string;
}

export async function generateImage(params: {
  prompt: string;
  width?: number;
  height?: number;
}): Promise<GeneratedImage[]> {
  const { prompt, width = 1024, height = 1024 } = params;

  const result = await hf.textToImage({
    model: IMAGE_MODEL,
    inputs: prompt,
    parameters: {
      width,
      height,
      num_inference_steps: 4,
    },
  });

  // HfInference.textToImage は Blob を返す
  const blob = result as unknown as Blob;
  const arrayBuffer = await blob.arrayBuffer();
  return [
    {
      data: Buffer.from(arrayBuffer),
      mimeType: (blob as Blob).type || "image/jpeg",
    },
  ];
}

// アスペクト比 → 解像度マップ
export function ratioToSize(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  const baseSize = resolution === "2K" ? 1280 : resolution === "512" ? 512 : 1024;
  const ratioMap: Record<string, [number, number]> = {
    "1:1":  [1, 1],
    "16:9": [16, 9],
    "9:16": [9, 16],
    "4:3":  [4, 3],
    "3:4":  [3, 4],
    "4:5":  [4, 5],
    "5:4":  [5, 4],
    "21:9": [21, 9],
  };
  const [rw, rh] = ratioMap[aspectRatio] ?? [1, 1];
  const width = Math.round(baseSize * Math.sqrt(rw / rh) / 64) * 64;
  const height = Math.round(baseSize * Math.sqrt(rh / rw) / 64) * 64;
  // FLUX.1-schnell は最大1024x1024程度が安定
  return {
    width: Math.min(width, 1344),
    height: Math.min(height, 1344),
  };
}
