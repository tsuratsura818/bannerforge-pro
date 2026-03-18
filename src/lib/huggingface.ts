// Pollinations.ai — 完全無料・APIキー不要・FLUX.1モデル使用
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

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

  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=false`;

  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) {
    throw new Error(`Pollinations API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return [{ data: Buffer.from(arrayBuffer), mimeType: contentType }];
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
  const width  = Math.round(baseSize * Math.sqrt(rw / rh) / 64) * 64;
  const height = Math.round(baseSize * Math.sqrt(rh / rw) / 64) * 64;
  return {
    width:  Math.min(width,  1344),
    height: Math.min(height, 1344),
  };
}
