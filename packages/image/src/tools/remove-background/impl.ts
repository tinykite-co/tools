import { removeBackground, Config } from "@imgly/background-removal";
import type { RemoveBackgroundOptions } from "./types.js";
import type { BinaryData } from "@tinykite/core";

export async function removeImageBackground(
  image: BinaryData | Blob,
  options: Omit<RemoveBackgroundOptions, 'image'> = {}
): Promise<Blob> {
  const { publicPath, onProgress } = options;

  let input: Blob | Uint8Array | ArrayBuffer;
  if (image instanceof Blob) {
    input = image;
  } else if (image instanceof Uint8Array) {
    input = image;
  } else {
    // ArrayBuffer to Uint8Array for safety
    input = new Uint8Array(image);
  }

  const config: Config = {
    progress: (key, current, total) => {
      if (onProgress) {
        // imgly gives progress across different stages (fetch, model load, compute)
        // This is a rough estimation of percent
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        onProgress(percent, `Processing: ${key}`);
      }
    }
  };

  if (publicPath) {
    config.publicPath = publicPath;
  }

  // Uses imgly background removal WASM to remove background
  const resultBlob = await removeBackground(input, config);
  return resultBlob;
}
