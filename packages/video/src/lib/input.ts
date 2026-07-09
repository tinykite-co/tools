import { ValidationError } from "@tinykite/core";

export interface VideoInput {
  blob: Blob;
  filename: string;
}

type NestedFile = {
  image?: Blob | ArrayBuffer;
  video?: Blob | ArrayBuffer;
  filename?: string;
};

function toBlob(data: Blob | ArrayBuffer, mimeHint = "application/octet-stream"): Blob {
  if (data instanceof Blob) {
    return data;
  }
  return new Blob([data], { type: mimeHint });
}

function fromNested(source: NestedFile, fallbackName: string): VideoInput | null {
  const raw = source.video ?? source.image;
  if (!raw) {
    return null;
  }
  return {
    blob: toBlob(raw),
    filename: source.filename?.trim() || fallbackName
  };
}

/**
 * Normalize ToolRunner / worker payloads for video file fields.
 * FieldInput always wraps single files as `{ image: File, filename }`.
 */
export function extractVideoInput(payload: unknown, fallbackName = "video.mp4"): VideoInput {
  if (payload == null || payload === "") {
    throw new ValidationError("Video file is required.");
  }

  if (payload instanceof Blob) {
    const name =
      payload instanceof File && payload.name ? payload.name : fallbackName;
    return { blob: payload, filename: name };
  }

  if (payload instanceof ArrayBuffer) {
    return { blob: toBlob(payload), filename: fallbackName };
  }

  if (typeof payload !== "object") {
    throw new ValidationError("Video file is required.");
  }

  const record = payload as Record<string, unknown> & NestedFile;

  // Multi-param form: { video: { image, filename }, ... }
  if (record.video && typeof record.video === "object") {
    if (record.video instanceof Blob || record.video instanceof ArrayBuffer) {
      return {
        blob: toBlob(record.video),
        filename:
          typeof record.filename === "string" && record.filename
            ? record.filename
            : fallbackName
      };
    }
    const nested = fromNested(record.video as NestedFile, fallbackName);
    if (nested) {
      return nested;
    }
  }

  // Single-param or nested image wrapper from FieldInput
  const direct = fromNested(record, fallbackName);
  if (direct) {
    return direct;
  }

  throw new ValidationError("Video file is required.");
}
