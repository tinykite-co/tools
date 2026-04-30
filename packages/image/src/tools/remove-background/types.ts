import type { BinaryData } from "@tinykite/core";

export interface RemoveBackgroundOptions {
  /**
   * The image data to process
   */
  image: BinaryData | Blob;
  /**
   * Optional base URL where the ONNX models are hosted.
   * If not provided, it fetches from the default CDN.
   */
  publicPath?: string;
  /**
   * Optional progress callback
   */
  onProgress?: (percent: number, message?: string) => void;
}
