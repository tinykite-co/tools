import { removeImageBackground } from "@tinykite/image";
import { resizeImage } from "@tinykite/image";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface IndiaPassportPhotoPayload {
  image: Blob | ArrayBuffer;
  filename: string;
}

export async function indiaPassportPhotoTask(
  payload: IndiaPassportPhotoPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  // 1. Remove Background
  ctx?.reportProgress?.(10, "Removing background...");
  
  const mimeType = payload.filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const imageBlob = new Blob([payload.image], { type: mimeType });
  
  const transparentBlob = await removeImageBackground(
    imageBlob,
    {
      onProgress: (percent) => {
        ctx?.reportProgress?.(10 + Math.round(percent * 0.4), "Processing background...");
      }
    }
  );

  ctx?.reportProgress?.(50, "Generating passport format...");

  // 2. We need a 600x600 photo with a solid white background.
  // First, get the transparent image as an ImageBitmap.
  const bitmap = await createImageBitmap(transparentBlob);

  // 3. Create a 600x600 canvas (2x2 inches at 300 DPI)
  const canvas = new OffscreenCanvas(600, 600);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to get 2D context");

  // Fill with white background
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 600, 600);

  // 4. Draw the subject. 
  // We want the subject to be centered and occupy most of the frame.
  // Calculate scaling to fit within 600x600 while maintaining aspect ratio,
  // leaving a small margin (e.g., 50px padding on each side).
  const targetSize = 500; 
  const scale = Math.min(targetSize / bitmap.width, targetSize / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const x = (600 - w) / 2;
  const y = (600 - h) / 2; // Center horizontally and vertically

  context.drawImage(bitmap, x, y, w, h);

  // 5. Export
  ctx?.reportProgress?.(80, "Exporting photo...");
  const finalBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
  const data = new Uint8Array(await finalBlob.arrayBuffer());

  const baseName = payload.filename.split('.').slice(0, -1).join('.') || 'photo';

  const asset: OutputAsset = {
    id: `passport-${Date.now()}`,
    kind: "file",
    label: "India Passport Photo (2x2)",
    fileName: `${baseName}-india-passport.jpg`,
    mimeType: "image/jpeg",
    data,
    sizeBytes: data.length
  };

  ctx?.reportProgress?.(100, "Done!");

  return { assets: [asset] };
}
