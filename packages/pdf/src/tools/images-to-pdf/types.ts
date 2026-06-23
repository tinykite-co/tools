import type { BinaryData } from "@tinykite/core";

export interface ImagesToPdfOptions {
  images: Array<BinaryData | Blob | { image?: BinaryData | Blob; data?: BinaryData | Blob; filename?: string }>;
  /** Optional output filename base; defaults derived from first image or 'images' */
  outputFileName?: string;
}

export interface ImagesToPdfSummary {
  pageCount: number;
  fileName: string;
  sourceCount: number;
}
