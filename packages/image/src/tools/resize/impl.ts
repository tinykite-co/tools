import type { BinaryData } from "@tinykite/core";

import type { ResizeOptions } from "./types.js";

export async function resizeImage(options: ResizeOptions): Promise<Blob> {
  const { image, width, height, maintainAspectRatio = false } = options;
  
  let blob: Blob;
  if (image instanceof Blob) {
    blob = image;
  } else {
    blob = new Blob([image as any]);
  }

  // createImageBitmap is available in Window and Web Workers
  const bitmap = await createImageBitmap(blob);

  let targetWidth = width;
  let targetHeight = height;

  if (maintainAspectRatio) {
    const ratio = bitmap.width / bitmap.height;
    if (width / height > ratio) {
      targetWidth = height * ratio;
    } else {
      targetHeight = width / ratio;
    }
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  // Convert to Blob
  const resultBlob = await canvas.convertToBlob({ type: "image/png" });
  return resultBlob;
}
