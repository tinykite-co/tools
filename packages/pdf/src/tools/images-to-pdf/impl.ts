import { PDFDocument } from "pdf-lib";

import type { ImagesToPdfOptions, ImagesToPdfSummary } from "./types";
import { deriveOutputName } from "@tinykite/core";

export function imagesToPdfPlaceholder(options: Partial<ImagesToPdfOptions> = {}): string {
  const count = Array.isArray(options.images) ? options.images.length : 0;
  return `images-to-pdf placeholder (${count} image(s))`;
}

function isBlobLike(v: unknown): v is Blob {
  return typeof Blob !== "undefined" && v instanceof Blob;
}

function isArrayBufferView(v: unknown): v is ArrayBufferView {
  return ArrayBuffer.isView(v);
}

async function toUint8Array(input: unknown): Promise<Uint8Array> {
  if (input == null) throw new Error("Empty image input");
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (isArrayBufferView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  if (isBlobLike(input)) return new Uint8Array(await input.arrayBuffer());
  // support {image: ...} wrapper that appears in UI payloads
  if (typeof input === "object") {
    const rec = input as Record<string, unknown>;
    const inner = rec.image ?? rec.data ?? rec.file;
    if (inner) return toUint8Array(inner);
  }
  // last resort: treat as array-like
  return new Uint8Array(input as any);
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

async function rasterizeToPng(input: Uint8Array | Blob): Promise<Uint8Array> {
  const blob = isBlobLike(input) ? input : new Blob([input as BlobPart]);
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D context for rasterization");
  ctx.drawImage(bitmap, 0, 0);
  const out = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await out.arrayBuffer());
}

function getFirstFileName(images: ImagesToPdfOptions["images"]): string | undefined {
  for (const img of images) {
    if (img && typeof img === "object" && !isBlobLike(img) && !(img instanceof ArrayBuffer) && !isArrayBufferView(img)) {
      const rec = img as any;
      if (rec.filename) return rec.filename;
      if (rec.name) return rec.name;
    }
    if (isBlobLike(img) && "name" in (img as any)) return (img as any).name;
  }
  return undefined;
}

export async function imagesToPdf(options: ImagesToPdfOptions): Promise<Uint8Array> {
  const { images } = options;
  if (!images || images.length === 0) {
    throw new Error("At least one image is required");
  }

  const pdfDoc = await PDFDocument.create();

  for (const src of images) {
    const bytes = await toUint8Array(src);

    let embedded;
    if (isJpeg(bytes)) {
      embedded = await pdfDoc.embedJpg(bytes);
    } else if (isPng(bytes)) {
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      const pngBytes = await rasterizeToPng(bytes);
      embedded = await pdfDoc.embedPng(pngBytes);
    }

    const w = embedded.width;
    const h = embedded.height;

    // Use native image dimensions as page size (pixels at 72 dpi — standard for such converters)
    const page = pdfDoc.addPage([w, h]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: w,
      height: h
    });
  }

  return await pdfDoc.save();
}

export async function imagesToPdfWithSummary(
  options: ImagesToPdfOptions
): Promise<{ pdf: Uint8Array; summary: ImagesToPdfSummary }> {
  const pdf = await imagesToPdf(options);
  const inputFileName = getFirstFileName(options.images) ?? "image.jpg";
  const fileName = options.outputFileName ?? deriveOutputName(inputFileName, "-images", ".pdf");

  return {
    pdf,
    summary: {
      pageCount: (await PDFDocument.load(pdf)).getPageCount(),
      fileName,
      sourceCount: options.images.length
    }
  };
}
