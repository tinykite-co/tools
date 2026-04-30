import type { BinaryData } from "@tinykite/core";

export interface CropOptions {
  image: BinaryData | Blob;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropImage(options: CropOptions): Promise<Blob> {
  const { image, x, y, width, height } = options;

  let blob: Blob;
  if (image instanceof Blob) {
    blob = image;
  } else {
    blob = new Blob([image as any]);
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);

  const resultBlob = await canvas.convertToBlob({ type: "image/png" });
  return resultBlob;
}
