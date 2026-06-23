import { imagesToPdf } from "@tinykite/pdf";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface ImagesToPdfTaskPayload {
  images?: Array<Blob | ArrayBuffer | { image?: Blob | ArrayBuffer; filename?: string; name?: string }>;
  // also accept direct array for convenience when payload is the images list
  [key: string]: unknown;
}

function unwrapImage(entry: unknown): { raw: Blob | ArrayBuffer; filename: string } | null {
  if (!entry) return null;
  if (entry instanceof Blob || entry instanceof ArrayBuffer) {
    return { raw: entry, filename: (entry as any).name ?? "image.jpg" };
  }
  if (typeof entry === "object") {
    const rec = entry as any;
    const inner = rec.image ?? rec.data ?? rec.file ?? rec;
    if (inner instanceof Blob || inner instanceof ArrayBuffer) {
      return { raw: inner, filename: rec.filename ?? rec.name ?? (inner as any).name ?? "image.jpg" };
    }
  }
  return null;
}

function normalizeImages(payload: unknown): { raw: Blob | ArrayBuffer; filename: string }[] {
  const results: { raw: Blob | ArrayBuffer; filename: string }[] = [];

  if (!payload) {
    throw new Error("No images provided");
  }

  let list: unknown[] = [];

  if (Array.isArray(payload)) {
    list = payload;
  } else if (typeof payload === "object") {
    const p = payload as any;
    if (Array.isArray(p.images)) list = p.images;
    else if (p.image) list = [p.image]; // allow single-image shape too
    else if (p.images && typeof p.images === "object") list = [p.images];
    else {
      // maybe the whole payload is a single wrapped image
      const single = unwrapImage(p);
      if (single) list = [single];
    }
  }

  for (const item of list) {
    const unwrapped = unwrapImage(item);
    if (unwrapped) {
      results.push(unwrapped);
    }
  }

  if (results.length === 0) {
    throw new Error("No valid images found in input");
  }

  return results;
}

export async function imagesToPdfTask(
  payload: ImagesToPdfTaskPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  const prepared = normalizeImages(payload);

  ctx?.reportProgress?.(5, "Preparing images...");

  // Convert to blobs for the pdf function (it accepts Blobs and will read bytes)
  const blobs: Blob[] = prepared.map((p, i) => {
    if (p.raw instanceof Blob) return p.raw;
    const name = p.filename.toLowerCase();
    const type = name.endsWith(".png") ? "image/png" : "image/jpeg";
    return new Blob([p.raw], { type });
  });

  ctx?.reportProgress?.(20, `Embedding ${blobs.length} image(s) into PDF...`);

  const pdfBytes = await imagesToPdf({ images: blobs });

  ctx?.reportProgress?.(85, "Finalizing PDF...");

  const firstName = prepared[0]?.filename ?? "image.jpg";
  const base = firstName.replace(/\.[^.]+$/, "") || "images";
  const fileName = prepared.length === 1 ? `${base}.pdf` : `${base}-images.pdf`;

  const data = pdfBytes; // already Uint8Array from pdf-lib

  const asset: OutputAsset = {
    id: `pdf-${Date.now()}`,
    kind: "file",
    label: `PDF with ${prepared.length} page(s)`,
    fileName,
    mimeType: "application/pdf",
    data,
    sizeBytes: data.byteLength
  };

  ctx?.reportProgress?.(100, "Done!");

  return { assets: [asset] };
}
