export type AssetKind = "file" | "text" | "data";

export type BinaryData = Uint8Array | ArrayBuffer;

export interface Asset {
  id: string;
  kind: AssetKind;
  label: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface OutputAsset extends Asset {
  fileName: string;
  data: BinaryData;
}

export interface ProgressUpdate {
  percent: number;
  message?: string;
}

export interface ProgressEvent {
  jobId: string;
  percent: number;
  message?: string;
}

export function toProgressEvent(
  jobId: string,
  update: ProgressUpdate
): ProgressEvent {
  return { jobId, ...update };
}

export interface JobResult<T = unknown> {
  output: T;
  assets: OutputAsset[];
}
