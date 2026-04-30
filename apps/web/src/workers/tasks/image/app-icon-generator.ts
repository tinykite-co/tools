import { removeImageBackground } from "@tinykite/image";
import { resizeImage } from "@tinykite/image";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface AppIconGeneratorPayload {
  image: Blob | ArrayBuffer;
  filename: string;
}

const SIZES = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-64x64.png", size: 64 },
  { name: "apple-touch-icon-180x180.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
  { name: "app-store-1024x1024.png", size: 1024 }
];

export async function appIconGeneratorTask(
  payload: AppIconGeneratorPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  // 1. Remove Background
  ctx?.reportProgress?.(10, "Removing background...");
  
  // Construct a Blob inside the worker to ensure correct prototype and MIME type
  const mimeType = payload.filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const imageBlob = new Blob([payload.image], { type: mimeType });
  
  const transparentBlob = await removeImageBackground(
    imageBlob,
    {
      onProgress: (percent) => {
        // Map 0-100 to 10-60
        ctx?.reportProgress?.(10 + Math.round(percent * 0.5), "Processing image background...");
      }
    }
  );

  const assets: OutputAsset[] = [];
  const baseName = payload.filename.split('.').slice(0, -1).join('.') || 'logo';

  // 2. Generate all sizes
  for (let i = 0; i < SIZES.length; i++) {
    const { name, size } = SIZES[i]!;
    
    ctx?.reportProgress?.(60 + Math.round((i / SIZES.length) * 40), `Generating ${name}...`);
    
    const resizedBlob = await resizeImage({
      image: transparentBlob,
      width: size,
      height: size,
      maintainAspectRatio: true
    });

    const data = new Uint8Array(await resizedBlob.arrayBuffer());
    assets.push({
      id: `icon-${size}-${Date.now()}`,
      kind: "file",
      label: `${size}x${size}`,
      fileName: `${baseName}-${name}`,
      mimeType: "image/png",
      data,
      sizeBytes: data.length
    });
  }

  ctx?.reportProgress?.(100, "Done!");

  return { assets };
}
