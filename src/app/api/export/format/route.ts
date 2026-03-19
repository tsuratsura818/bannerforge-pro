import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { writePsd } from "ag-psd";

export const maxDuration = 30;

const FORMATS = ["png", "jpeg", "webp", "svg", "pdf", "psd"] as const;
type ExportFormat = (typeof FORMATS)[number];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, format } = await request.json() as { imageUrl: string; format: ExportFormat };
    if (!imageUrl || !FORMATS.includes(format)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // 元画像を取得
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("画像の取得に失敗しました");
    const sourceBuffer = Buffer.from(await imageRes.arrayBuffer());

    let outputBuffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "jpeg":
        outputBuffer = await sharp(sourceBuffer).jpeg({ quality: 95 }).toBuffer();
        contentType = "image/jpeg";
        filename = "bannerforge.jpg";
        break;

      case "webp":
        outputBuffer = await sharp(sourceBuffer).webp({ quality: 95 }).toBuffer();
        contentType = "image/webp";
        filename = "bannerforge.webp";
        break;

      case "svg": {
        const meta = await sharp(sourceBuffer).metadata();
        const { width = 1024, height = 1024 } = meta;
        const base64 = sourceBuffer.toString("base64");
        const svg = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
          `     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
          `  <image width="${width}" height="${height}"`,
          `         xlink:href="data:image/png;base64,${base64}"/>`,
          `</svg>`,
        ].join("\n");
        outputBuffer = Buffer.from(svg, "utf-8");
        contentType = "image/svg+xml";
        filename = "bannerforge.svg";
        break;
      }

      case "pdf": {
        const meta = await sharp(sourceBuffer).metadata();
        const { width = 1024, height = 1024 } = meta;
        const pngBuffer = await sharp(sourceBuffer).png().toBuffer();
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([width, height]);
        const embeddedImg = await pdfDoc.embedPng(pngBuffer);
        page.drawImage(embeddedImg, { x: 0, y: 0, width, height });
        outputBuffer = Buffer.from(await pdfDoc.save());
        contentType = "application/pdf";
        filename = "bannerforge.pdf";
        break;
      }

      case "psd": {
        const { data: rawData, info } = await sharp(sourceBuffer)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const imageData = {
          data: new Uint8ClampedArray(rawData),
          width: info.width,
          height: info.height,
        } as ImageData;

        const psdArrayBuffer = writePsd({
          width: info.width,
          height: info.height,
          children: [{ name: "BannerForge", imageData }],
        });
        outputBuffer = Buffer.from(psdArrayBuffer);
        contentType = "application/octet-stream";
        filename = "bannerforge.psd";
        break;
      }

      default: // png
        outputBuffer = await sharp(sourceBuffer).png().toBuffer();
        contentType = "image/png";
        filename = "bannerforge.png";
    }

    return new NextResponse(outputBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const msg = error instanceof Error ? error.message : "エクスポートに失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
