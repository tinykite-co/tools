import { convertImage, type ImageFormat } from "@tinykite/image";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface ConvertImagePayload {
  image?: Blob | ArrayBuffer | string | { image: Blob | ArrayBuffer | string; filename?: string };
  filename?: string;
  format?: ImageFormat;
  quality?: number | string;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
}

function normalizeInput(payload: any) {
  let rawImage: Blob | ArrayBuffer | string | undefined;
  let filename = "image";
  let targetFormat: ImageFormat = "png";

  if (!payload) {
    throw new Error("No input provided");
  }

  if (payload.image && typeof payload.image === "object" && "image" in payload.image) {
    rawImage = payload.image.image;
    if (payload.image.filename) filename = payload.image.filename;
  } else if (payload.image) {
    rawImage = payload.image;
    if (payload.filename) filename = payload.filename;
  } else if (payload instanceof Blob || payload instanceof ArrayBuffer || typeof payload === "string") {
    rawImage = payload;
  }

  if (!rawImage) {
    throw new Error("Image is required");
  }

  if (payload.format && ["png", "jpeg", "webp", "svg"].includes(String(payload.format).toLowerCase())) {
    targetFormat = String(payload.format).toLowerCase() as ImageFormat;
  }

  const qualityNum = payload.quality !== undefined ? parseFloat(String(payload.quality)) : undefined;
  const quality = qualityNum && !isNaN(qualityNum) ? Math.min(Math.max(qualityNum, 0.1), 1.0) : 0.9;

  const width = payload.width ? parseInt(String(payload.width), 10) : undefined;
  const height = payload.height ? parseInt(String(payload.height), 10) : undefined;
  const backgroundColor = payload.backgroundColor ? String(payload.backgroundColor) : undefined;

  return { rawImage, filename, targetFormat, quality, width, height, backgroundColor };
}

export async function convertImageTask(
  payload: ConvertImagePayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  const { rawImage, filename, targetFormat, quality, width, height, backgroundColor } =
    normalizeInput(payload);

  ctx?.reportProgress?.(10, "Preparing image...");

  ctx?.reportProgress?.(40, `Converting to ${targetFormat.toUpperCase()}...`);

  const resultBlob = await convertImage({
    image: rawImage as any,
    targetFormat,
    quality,
    width,
    height,
    backgroundColor
  });

  ctx?.reportProgress?.(80, "Packaging output...");

  const data = new Uint8Array(await resultBlob.arrayBuffer());
  const baseName = filename.split(".").slice(0, -1).join(".") || "image";

  const extMap: Record<ImageFormat, string> = {
    png: "png",
    jpeg: "jpg",
    webp: "webp",
    svg: "svg"
  };

  const mimeMap: Record<ImageFormat, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml"
  };

  const outExt = extMap[targetFormat];
  const outMime = mimeMap[targetFormat];
  const outFileName = `${baseName}-converted.${outExt}`;

  const asset: OutputAsset = {
    id: `converted-${Date.now()}`,
    kind: "file",
    label: `Converted (${targetFormat.toUpperCase()})`,
    fileName: outFileName,
    mimeType: outMime,
    data,
    sizeBytes: data.length
  };

  ctx?.reportProgress?.(100, "Done!");

  return { assets: [asset] };
}
