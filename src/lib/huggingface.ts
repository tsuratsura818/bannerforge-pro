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

// Pollinations.ai URL を構築（クライアントサイドで直接呼び出し可能）
export function buildPollinationsUrl(
  prompt: string,
  width: number,
  height: number,
  seed?: number
): string {
  const s = seed ?? Math.floor(Math.random() * 999999);
  // model パラメータなし = デフォルト(flux)、サイズは最大1024に制限
  const w = Math.min(width, 1024);
  const h = Math.min(height, 1024);
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${w}&height=${h}&nologo=true&seed=${s}`
  );
}
