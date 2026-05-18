import { deriveOutputName, type JobResult } from "@tinykite/core";
import { StandardFonts, rgb, type PDFDocument } from "pdf-lib";

import { fillField, isSupportedFillField } from "./fillField";
import { toFormField } from "./fields";
import { getSourceFileName, loadPdfDocument } from "./source";
import type {
  FillPdfFormOptions,
  FillPdfFormSummary,
  InspectPdfFormOptions,
  InspectPdfFormResult,
  PdfTextOverlay
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function drawTextOverlays(
  pdfDoc: PDFDocument,
  overlays: PdfTextOverlay[] = []
): Promise<number> {
  if (overlays.length === 0) return 0;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  let drawnCount = 0;

  for (const overlay of overlays) {
    const text = overlay.text.trim();
    const page = pages[overlay.pageIndex];
    if (!text || !page) continue;

    const { width, height } = page.getSize();
    const fontSize = clamp(overlay.fontSize ?? 12, 6, 48);
    const x = clamp(overlay.x, 0, 1) * width;
    const y = height - clamp(overlay.y, 0, 1) * height - fontSize;

    page.drawText(text, {
      x: clamp(x, 0, width - 8),
      y: clamp(y, 0, height - fontSize),
      size: fontSize,
      font,
      color: rgb(0.05, 0.06, 0.08),
      maxWidth: Math.max(1, width - x - 18)
    });
    drawnCount += 1;
  }

  return drawnCount;
}

export async function inspectPdfForm(
  options: InspectPdfFormOptions
): Promise<InspectPdfFormResult> {
  const pdfDoc = await loadPdfDocument(options.pdf);
  const fields = pdfDoc.getForm().getFields().map(toFormField);

  return {
    fileName: getSourceFileName(options.pdf),
    fieldCount: fields.length,
    fillableFieldCount: fields.filter((field) => !field.readOnly).length,
    fields
  };
}

export async function fillPdfForm(
  options: FillPdfFormOptions
): Promise<JobResult<FillPdfFormSummary>> {
  const pdfDoc = await loadPdfDocument(options.pdf);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const skippedFields: string[] = [];
  let filledCount = 0;

  for (const field of fields) {
    const name = field.getName();
    if (!(name in options.values)) continue;

    if (!isSupportedFillField(field) || field.isReadOnly()) {
      skippedFields.push(name);
      continue;
    }

    try {
      if (fillField(field, options.values[name])) filledCount += 1;
    } catch {
      skippedFields.push(name);
    }
  }

  const textOverlayCount = await drawTextOverlays(pdfDoc, options.textOverlays);

  if (options.flatten) form.flatten();
  else form.updateFieldAppearances();

  const data = await pdfDoc.save();
  const inputFileName = getSourceFileName(options.pdf) ?? "document.pdf";
  const fileName = options.outputFileName ?? deriveOutputName(inputFileName, "-filled", ".pdf");

  return {
    output: {
      fileName,
      fieldCount: fields.length,
      filledCount,
      textOverlayCount,
      skippedFields
    },
    assets: [
      {
        id: "filled-pdf",
        kind: "file",
        label: "Filled PDF",
        fileName,
        mimeType: "application/pdf",
        sizeBytes: data.byteLength,
        data
      }
    ]
  };
}
