import { ProcessingError, ValidationError } from "@tinykite/core";
import { PDFDocument } from "pdf-lib";

import type { PdfSource } from "./types";

function isBlobLike(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

function isSourceObject(
  source: PdfSource
): source is Extract<PdfSource, Record<string, unknown>> {
  return (
    source !== null &&
    typeof source === "object" &&
    !isBlobLike(source) &&
    !(source instanceof ArrayBuffer) &&
    !isArrayBufferView(source)
  );
}

function unwrapPdfSource(source: PdfSource): unknown {
  if (isSourceObject(source)) {
    return source.pdf ?? source.file ?? source.image ?? source.data;
  }

  return source;
}

export function getSourceFileName(source: PdfSource): string | undefined {
  if (isSourceObject(source)) {
    return source.filename ?? source.name;
  }

  if (isBlobLike(source) && "name" in source && typeof source.name === "string") {
    return source.name;
  }

  return undefined;
}

async function readPdfBytes(source: PdfSource): Promise<Uint8Array> {
  const input = unwrapPdfSource(source);

  if (!input) {
    throw new ValidationError("Please upload an editable PDF.");
  }

  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (isArrayBufferView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (isBlobLike(input)) {
    return new Uint8Array(await input.arrayBuffer());
  }

  throw new ValidationError("PDF input must be a PDF file or binary data.");
}

export async function loadPdfDocument(source: PdfSource): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await readPdfBytes(source), { ignoreEncryption: true });
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ProcessingError("The uploaded file could not be read as an editable PDF.");
  }
}
