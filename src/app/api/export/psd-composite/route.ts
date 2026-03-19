import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { writePsd } from "ag-psd";

export const maxDuration = 60;

interface ImageLayerInput {
  type: "image";
  name: string;
  src?: string;       // https URL (server can fetch)
  srcBase64?: string; // base64 data from client blob:
  mimeType?: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  opacity: number;
  visible: boolean;
}

interface TextLayerInput {
  type: "text";
  name: string;
  text: string;
  xPct: number;
  yPct: number;
  fontSizePct: number;
  color: string;
  fontFamily: string;
  bold: boolean;
  align: "left" | "center" | "right";
  visible: boolean;
}

type LayerInput = ImageLayerInput | TextLayerInput;

// CSS font family → PostScript name
const FONT_PS: Record<string, { r: string; b: string }> = {
  "sans-serif":  { r: "ArialMT",               b: "Arial-BoldMT" },
  "serif":       { r: "TimesNewRomanPSMT",      b: "TimesNewRomanPS-BoldMT" },
  "Impact":      { r: "Impact",                 b: "Impact" },
  "Arial Black": { r: "Arial-BlackMT",          b: "Arial-BlackMT" },
};

function hexRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { backgroundUrl, layers } = await request.json() as {
      backgroundUrl: string;
      layers: LayerInput[];
    };
    if (!backgroundUrl) {
      return NextResponse.json({ error: "backgroundUrl が必要です" }, { status: 400 });
    }

    // ── 背景画像を取得 ──
    const bgRes = await fetch(backgroundUrl);
    if (!bgRes.ok) throw new Error("背景画像の取得に失敗しました");
    const bgBuf = Buffer.from(await bgRes.arrayBuffer());

    const { data: bgRaw, info: bgInfo } = await sharp(bgBuf)
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const W = bgInfo.width;
    const H = bgInfo.height;

    const bgImageData = {
      data: new Uint8ClampedArray(bgRaw),
      width: W, height: H,
    } as ImageData;

    // ── PSD children 構築 ──
    const children: object[] = [
      { name: "背景", left: 0, top: 0, right: W, bottom: H, imageData: bgImageData },
    ];

    for (const layer of (layers ?? [])) {
      if (!layer.visible) continue;

      if (layer.type === "image") {
        // バッファを取得
        let imgBuf: Buffer | null = null;
        if (layer.srcBase64) {
          imgBuf = Buffer.from(layer.srcBase64, "base64");
        } else if (layer.src) {
          const r = await fetch(layer.src);
          if (r.ok) imgBuf = Buffer.from(await r.arrayBuffer());
        }
        if (!imgBuf) continue;

        // ターゲットサイズ
        const tW = Math.max(1, Math.round((layer.wPct / 100) * W));
        const tH = Math.max(1, Math.round((layer.hPct / 100) * H));
        const tL = Math.round((layer.xPct / 100) * W - tW / 2);
        const tT = Math.round((layer.yPct / 100) * H - tH / 2);

        const { data: layerRaw, info: li } = await sharp(imgBuf)
          .resize(tW, tH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

        children.push({
          name: layer.name,
          left: tL, top: tT,
          right: tL + li.width, bottom: tT + li.height,
          opacity: layer.opacity,
          imageData: {
            data: new Uint8ClampedArray(layerRaw),
            width: li.width, height: li.height,
          } as ImageData,
        });

      } else {
        // テキストレイヤー
        const fp = FONT_PS[layer.fontFamily] ?? FONT_PS["sans-serif"];
        const psName = layer.bold ? fp.b : fp.r;
        const fontSize = (layer.fontSizePct / 100) * H;
        const x = (layer.xPct / 100) * W;
        const y = (layer.yPct / 100) * H;
        const color = hexRgb(layer.color);
        const justify = layer.align === "center" ? "center" : layer.align === "right" ? "right" : "left";

        children.push({
          name: layer.name,
          text: {
            text: layer.text,
            transform: { xx: 1, xy: 0, yx: 0, yy: 1, tx: x, ty: y },
            style: {
              font: { name: psName },
              fontSize,
              fillColor: { r: color.r, g: color.g, b: color.b },
            },
            styleRuns: [{
              length: layer.text.length,
              style: {
                font: { name: psName },
                fontSize,
                fillColor: { r: color.r, g: color.g, b: color.b },
              },
            }],
            paragraphStyle: { justification: justify },
            paragraphStyleRuns: [{
              length: layer.text.length + 1,
              style: { justification: justify },
            }],
          },
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const psdBuf = Buffer.from(writePsd({
      width: W, height: H,
      imageData: bgImageData,
      children,
    } as Parameters<typeof writePsd>[0]));

    return new NextResponse(psdBuf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="bannerforge-composite.psd"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PSD composite error:", error);
    const msg = error instanceof Error ? error.message : "エクスポートに失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
