import type { BinaryData } from "@tinykite/core";

export type PdfSource =
  | BinaryData
  | Blob
  | {
      pdf?: BinaryData | Blob;
      file?: BinaryData | Blob;
      image?: BinaryData | Blob;
      data?: BinaryData | Blob;
      filename?: string;
      name?: string;
    };

export type PdfFormFieldType =
  | "text"
  | "checkbox"
  | "radio"
  | "dropdown"
  | "option-list"
  | "button"
  | "signature"
  | "unknown";

export interface PdfFormField {
  name: string;
  label: string;
  type: PdfFormFieldType;
  value?: string | boolean | string[];
  options?: string[];
  required: boolean;
  readOnly: boolean;
  multiline?: boolean;
  multiselect?: boolean;
}

export interface InspectPdfFormOptions {
  pdf: PdfSource;
}

export interface InspectPdfFormResult {
  fileName?: string;
  fieldCount: number;
  fillableFieldCount: number;
  fields: PdfFormField[];
}

export type PdfFieldValue = string | boolean | string[] | number | null | undefined;

export interface PdfTextOverlay {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
}

export interface FillPdfFormOptions {
  pdf: PdfSource;
  values: Record<string, PdfFieldValue>;
  textOverlays?: PdfTextOverlay[];
  flatten?: boolean;
  outputFileName?: string;
}

export interface FillPdfFormSummary {
  fileName: string;
  fieldCount: number;
  filledCount: number;
  textOverlayCount: number;
  skippedFields: string[];
}
