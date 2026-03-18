import sharp from "sharp";

export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number,
  options: { fit?: keyof sharp.FitEnum; format?: "png" | "jpeg" | "webp" } = {}
): Promise<Buffer> {
  const { fit = "cover", format = "png" } = options;
  return sharp(buffer)
    .resize(width, height, { fit })
    .toFormat(format)
    .toBuffer();
}

export async function convertToPng(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).png().toBuffer();
}

export async function getImageMetadata(buffer: Buffer) {
  return sharp(buffer).metadata();
}

export async function cropImage(
  buffer: Buffer,
  left: number,
  top: number,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(buffer).extract({ left, top, width, height }).png().toBuffer();
}
