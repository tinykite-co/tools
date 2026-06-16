import { cropImage } from "@tinykite/image";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface CropImagePayload {
  image?: Blob | ArrayBuffer | { image: Blob | ArrayBuffer; filename?: string };
  filename?: string;
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
}

function normalizeInput(payload: any) {
  let rawImage: Blob | ArrayBuffer | undefined;
  let filename = "image.jpg";
  let x: number, y: number, width: number, height: number;

  if (!payload) {
    throw new Error("No input provided");
  }

  if (payload.image && typeof payload.image === "object" && "image" in payload.image) {
    rawImage = payload.image.image;
    if (payload.image.filename) filename = payload.image.filename;
  } else if (payload.image) {
    rawImage = payload.image;
    if (payload.filename) filename = payload.filename;
  } else if (payload instanceof Blob || payload instanceof ArrayBuffer) {
    rawImage = payload;
  }

  if (!rawImage) {
    throw new Error("Image is required");
  }

  x = typeof payload.x === "string" ? parseInt(payload.x, 10) : Number(payload.x) || 0;
  y = typeof payload.y === "string" ? parseInt(payload.y, 10) : Number(payload.y) || 0;
  width = typeof payload.width === "string" ? parseInt(payload.width, 10) : Number(payload.width);
  height = typeof payload.height === "string" ? parseInt(payload.height, 10) : Number(payload.height);

  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error("Valid width and height are required");
  }

  return { rawImage, filename, x, y, width, height };
}

export async function cropImageTask(
  payload: CropImagePayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  const { rawImage, filename, x, y, width, height } = normalizeInput(payload);

  ctx?.reportProgress?.(10, "Preparing image...");

  const mimeType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const imageBlob = new Blob([rawImage], { type: mimeType });

  ctx?.reportProgress?.(30, "Cropping...");

  const resultBlob = await cropImage({
    image: imageBlob,
    x,
    y,
    width,
    height
  });

  ctx?.reportProgress?.(80, "Exporting...");

  const data = new Uint8Array(await resultBlob.arrayBuffer());

  const baseName = filename.split(".").slice(0, -1).join(".") || "image";
  const outFileName = `${baseName}-cropped-${width}x${height}.png`;

  const asset: OutputAsset = {
    id: `cropped-${Date.now()}`,
    kind: "file",
    label: `Cropped ${width}×${height}`,
    fileName: outFileName,
    mimeType: "image/png",
    data,
    sizeBytes: data.length
  };

  ctx?.reportProgress?.(100, "Done!");

  return { assets: [asset] };
}
