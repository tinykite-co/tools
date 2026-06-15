import { removeImageBackground } from "@tinykite/image";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface IndiaPassportPhotoPayload {
  // Support both single-param legacy shape and multi-param form values shape
  image?: Blob | ArrayBuffer | { image: Blob | ArrayBuffer; filename?: string };
  filename?: string;
  size?: string;
}

const DEFAULT_SIZE = "630x810";

const SUPPORTED_SIZES: Record<string, { width: number; height: number; display: string }> = {
  "630x810": { width: 630, height: 810, display: "630x810" },
  "600x600": { width: 600, height: 600, display: "600x600" },
  "413x531": { width: 413, height: 531, display: "413x531" }
};

// Framing constants derived from India Passport Seva / ICAO guidance:
// - Person (head to just below shoulders) should cover ~82% of final photo height.
// - We approximate the "shoulder line" at 68% down the detected subject content bbox.
// - Top headroom margin ~8.5% to ensure crown is not clipped.
// - Horizontal person width constrained to leave ~12% total side margins.
const PERSON_COVERAGE = 0.82;
const SHOULDER_FACTOR = 0.68;
const TOP_MARGIN_FACTOR = 0.085;
const MAX_PERSON_WIDTH_FACTOR = 0.88;
const ALPHA_THRESHOLD = 12;

export function parseTargetSize(sizeStr: string | undefined): { width: number; height: number; display: string } {
  const key = (sizeStr || DEFAULT_SIZE).trim();
  if (SUPPORTED_SIZES[key]) {
    return SUPPORTED_SIZES[key];
  }
  // Fallback parse "WxH"
  const match = key.match(/^(\d+)\s*x\s*(\d+)$/i);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (w > 0 && h > 0) {
      return { width: w, height: h, display: `${w}x${h}` };
    }
  }
  return SUPPORTED_SIZES[DEFAULT_SIZE];
}

export interface SubjectBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PassportDrawParams {
  scale: number;
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}

export function computePassportFraming(
  bounds: SubjectBounds,
  bitmapWidth: number,
  bitmapHeight: number,
  targetWidth: number,
  targetHeight: number
): PassportDrawParams {
  const { minX, minY, maxX, maxY } = bounds;

  const personTop = minY;
  const contentHeight = maxY - minY;
  const personShoulder = Math.min(maxY, personTop + Math.round(contentHeight * SHOULDER_FACTOR));

  const framedPersonPx = Math.max(1, personShoulder - personTop);

  let scale = (targetHeight * PERSON_COVERAGE) / framedPersonPx;

  const personWidth = Math.max(1, maxX - minX);
  const maxAllowedPersonWidth = targetWidth * MAX_PERSON_WIDTH_FACTOR;
  if (personWidth * scale > maxAllowedPersonWidth) {
    scale = maxAllowedPersonWidth / personWidth;
  }

  const topMargin = Math.round(targetHeight * TOP_MARGIN_FACTOR);

  const personCenterX = (minX + maxX) / 2;

  const drawW = bitmapWidth * scale;
  const drawH = bitmapHeight * scale;
  const drawX = Math.round(targetWidth / 2 - personCenterX * scale);
  const drawY = Math.round(topMargin - personTop * scale);

  return { scale, drawX, drawY, drawW, drawH };
}

function normalizeInput(payload: IndiaPassportPhotoPayload) {
  let rawImage: Blob | ArrayBuffer | undefined;
  let filename = "photo.jpg";
  let size = DEFAULT_SIZE;

  if (!payload) {
    throw new Error("No input provided");
  }

  if (typeof payload === "object") {
    const p = payload as any;
    if (p.image && typeof p.image === "object" && "image" in p.image) {
      // Multi-param payload from form: { image: {image, filename}, size }
      rawImage = p.image.image;
      if (p.image.filename) filename = p.image.filename;
      if (p.size) size = p.size;
    } else if (p.image) {
      // Direct image payload
      rawImage = p.image;
      if (p.filename) filename = p.filename;
      if (p.size) size = p.size;
    } else if ((p as Blob) instanceof Blob || p instanceof ArrayBuffer) {
      // Rare direct blob case
      rawImage = p as any;
    }
  }

  if (!rawImage) {
    throw new Error("Image is required");
  }

  return { rawImage, filename, size };
}

async function findSubjectBounds(bitmap: ImageBitmap): Promise<{ minX: number; minY: number; maxX: number; maxY: number }> {
  // Draw to temp canvas to read pixels (required for alpha inspection)
  const temp = new OffscreenCanvas(bitmap.width, bitmap.height);
  const tctx = temp.getContext("2d", { willReadFrequently: true });
  if (!tctx) {
    // Fallback: treat whole as subject
    return { minX: 0, minY: 0, maxX: bitmap.width - 1, maxY: bitmap.height - 1 };
  }
  tctx.drawImage(bitmap, 0, 0);
  const imgData = tctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const data = imgData.data;
  const w = bitmap.width;
  const h = bitmap.height;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  const alphaThreshold = ALPHA_THRESHOLD;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) {
    // No opaque pixels found (fully transparent subject) - fallback to full bounds
    return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 };
  }

  return { minX, minY, maxX, maxY };
}

async function composePassportPhoto(
  transparentBlob: Blob,
  targetWidth: number,
  targetHeight: number,
  ctx?: JobContext
): Promise<Blob> {
  ctx?.reportProgress?.(55, "Analyzing subject for passport framing...");

  const bitmap = await createImageBitmap(transparentBlob);

  const { minX, minY, maxX, maxY } = await findSubjectBounds(bitmap);

  // Use pure framing calculator (head + shoulders coverage, shoulder line approx, margins)
  const { drawX, drawY, drawW, drawH } = computePassportFraming(
    { minX, minY, maxX, maxY },
    bitmap.width,
    bitmap.height,
    targetWidth,
    targetHeight
  );

  ctx?.reportProgress?.(65, "Composing with official head-and-shoulders framing...");

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to get 2D context");

  // Solid white background (official requirement)
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);

  context.drawImage(bitmap, drawX, drawY, drawW, drawH);

  const finalBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return finalBlob;
}

export async function indiaPassportPhotoTask(
  payload: IndiaPassportPhotoPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  // 1. Normalize input (handles size selection and different payload shapes)
  const { rawImage, filename, size } = normalizeInput(payload);

  ctx?.reportProgress?.(10, "Removing background...");

  const mimeType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const imageBlob = new Blob([rawImage], { type: mimeType });

  const transparentBlob = await removeImageBackground(
    imageBlob,
    {
      onProgress: (percent) => {
        ctx?.reportProgress?.(10 + Math.round(percent * 0.40), "Processing background...");
      }
    }
  );

  const target = parseTargetSize(size);

  ctx?.reportProgress?.(52, `Generating India passport photo (${target.display})...`);

  // 2. Compose using spec-compliant framing (head + shoulders ~82%, just below shoulder)
  const finalBlob = await composePassportPhoto(transparentBlob, target.width, target.height, ctx);

  // 3. Export
  ctx?.reportProgress?.(82, "Exporting photo...");
  const data = new Uint8Array(await finalBlob.arrayBuffer());

  const baseName = filename.split(".").slice(0, -1).join(".") || "photo";
  const sizeLabel = target.display;

  const asset: OutputAsset = {
    id: `passport-${Date.now()}`,
    kind: "file",
    label: `India Passport Photo (${sizeLabel})`,
    fileName: `${baseName}-india-passport-${sizeLabel}.jpg`,
    mimeType: "image/jpeg",
    data,
    sizeBytes: data.length
  };

  ctx?.reportProgress?.(100, "Done!");

  return { assets: [asset] };
}
