import type { BinaryData } from "@tinykite/core";

export interface ResizeOptions {
  image: BinaryData | Blob;
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
}
