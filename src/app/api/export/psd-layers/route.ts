import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { writePsd } from "ag-psd";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrls } = await request.json() as { imageUrls: string[] };
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: "imageUrls が必要です" }, { status: 400 });
    }

    // 各画像を取得してレイヤーデータに変換
    const layers = await Promise.all(
      imageUrls.map(async (url, i) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`画像の取得に失敗: ${url}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const { data: rawData, info } = await sharp(buffer)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        return {
          name: `バリエーション ${i + 1}`,
          left: 0,
          top: 0,
          right: info.width,
          bottom: info.height,
          // 最初のレイヤーのみ表示、他は非表示
          hidden: i !== 0,
          imageData: {
            data: new Uint8ClampedArray(rawData),
            width: info.width,
            height: info.height,
          } as ImageData,
          _size: { width: info.width, height: info.height },
        };
      })
    );

    // キャンバスサイズは最初の画像に合わせる
    const { width, height } = layers[0]._size;

    // PSD 書き出し（merged composite = 最初のレイヤー）
    const psdArrayBuffer = writePsd({
      width,
      height,
      imageData: layers[0].imageData,
      children: layers.map(({ _size: _s, ...layer }) => layer),
    });

    const outputBuffer = Buffer.from(psdArrayBuffer);

    return new NextResponse(outputBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="bannerforge-layers.psd"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PSD layers export error:", error);
    const msg = error instanceof Error ? error.message : "エクスポートに失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
