import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { writePsd } from "ag-psd";

export const maxDuration = 30;

interface TextLayerInput {
  text: string;
  xPct: number;
  yPct: number;
  fontSizePct: number;
  color: string;
  fontFamily: string;
  bold: boolean;
  align: "left" | "center" | "right";
}

// CSS フォントファミリー → PostScript 名マッピング
const FONT_PS: Record<string, { regular: string; bold: string }> = {
  "sans-serif":  { regular: "ArialMT",               bold: "Arial-BoldMT" },
  "serif":       { regular: "TimesNewRomanPSMT",      bold: "TimesNewRomanPS-BoldMT" },
  "Impact":      { regular: "Impact",                 bold: "Impact" },
  "Arial Black": { regular: "Arial-BlackMT",          bold: "Arial-BlackMT" },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const JUSTIFY_MAP = {
  left: "left",
  center: "center",
  right: "right",
} as const;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, textLayers } = await request.json() as {
      imageUrl: string;
      textLayers: TextLayerInput[];
    };

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl が必要です" }, { status: 400 });
    }

    // 元画像を取得
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("画像の取得に失敗しました");
    const sourceBuffer = Buffer.from(await imgRes.arrayBuffer());

    const { data: rawData, info } = await sharp(sourceBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const W = info.width;
    const H = info.height;

    const backgroundImageData = {
      data: new Uint8ClampedArray(rawData),
      width: W,
      height: H,
    } as ImageData;

    // テキストレイヤーを構築
    const textChildren = (textLayers ?? []).map((layer, i) => {
      const fontInfo = FONT_PS[layer.fontFamily] ?? FONT_PS["sans-serif"];
      const psName = layer.bold ? fontInfo.bold : fontInfo.regular;
      const fontSize = (layer.fontSizePct / 100) * H;
      const x = (layer.xPct / 100) * W;
      const y = (layer.yPct / 100) * H;
      const color = hexToRgb(layer.color);

      return {
        name: `テキスト ${i + 1}`,
        // テキストレイヤーは imageData 不要 — Photoshop が自動生成
        text: {
          text: layer.text,
          transform: { xx: 1, xy: 0, yx: 0, yy: 1, tx: x, ty: y },
          style: {
            font: { name: psName },
            fontSize,
            fillColor: { r: color.r, g: color.g, b: color.b },
          },
          styleRuns: [
            {
              length: layer.text.length,
              style: {
                font: { name: psName },
                fontSize,
                fillColor: { r: color.r, g: color.g, b: color.b },
              },
            },
          ],
          paragraphStyle: { justification: JUSTIFY_MAP[layer.align] ?? "left" },
          paragraphStyleRuns: [
            {
              length: layer.text.length + 1,
              style: { justification: JUSTIFY_MAP[layer.align] ?? "left" },
            },
          ],
        },
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const psdArrayBuffer = writePsd({
      width: W,
      height: H,
      imageData: backgroundImageData,
      children: [
        {
          name: "Banner",
          left: 0,
          top: 0,
          right: W,
          bottom: H,
          imageData: backgroundImageData,
        },
        ...textChildren,
      ],
    } as Parameters<typeof writePsd>[0]);

    const outputBuffer = Buffer.from(psdArrayBuffer);

    return new NextResponse(outputBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="bannerforge-text.psd"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PSD text export error:", error);
    const msg = error instanceof Error ? error.message : "エクスポートに失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
