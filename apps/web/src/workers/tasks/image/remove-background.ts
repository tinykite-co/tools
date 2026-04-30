import { removeImageBackground } from "@tinykite/image";
import type { JobContext, OutputAsset } from "@tinykite/core";

export interface RemoveBackgroundPayload {
  image: Blob | ArrayBuffer;
  filename: string;
}

export async function removeBackgroundTask(
  payload: RemoveBackgroundPayload,
  ctx?: JobContext
): Promise<{ assets: OutputAsset[] }> {
  // 1. Process
  const mimeType = payload.filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const imageBlob = new Blob([payload.image], { type: mimeType });
  
  const resultBlob = await removeImageBackground(
    imageBlob,
    {
      onProgress: (percent, msg) => {
        ctx?.reportProgress?.(percent, msg);
      }
    }
  );

  // 2. Return as output asset
  const data = new Uint8Array(await resultBlob.arrayBuffer());
  const asset: OutputAsset = {
    id: `bg-removed-${Date.now()}`,
    kind: "file",
    label: "Background Removed",
    fileName: `transparent-${payload.filename}.png`,
    mimeType: "image/png",
    data: data,
    sizeBytes: data.length
  };

  return {
    assets: [asset]
  };
}
