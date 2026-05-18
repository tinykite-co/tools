import { deriveOutputName, type JobResult } from "@tinykite/core";

import { fillField, isSupportedFillField } from "./fillField";
import { toFormField } from "./fields";
import { getSourceFileName, loadPdfDocument } from "./source";
import type {
  FillPdfFormOptions,
  FillPdfFormSummary,
  InspectPdfFormOptions,
  InspectPdfFormResult
} from "./types";

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
