import type { BinaryData } from "@tinykite/core";

export type ImageFormat = "png" | "jpeg" | "webp" | "svg";

export interface ConvertImageOptions {
  image: BinaryData | Blob | string;
  targetFormat: ImageFormat;
  quality?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
}
