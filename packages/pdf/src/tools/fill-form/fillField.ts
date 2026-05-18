import {
  PDFCheckBox,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField
} from "pdf-lib";

import type { PdfFieldValue } from "./types";

export function isSupportedFillField(field: PDFField): boolean {
  return (
    field instanceof PDFTextField ||
    field instanceof PDFCheckBox ||
    field instanceof PDFRadioGroup ||
    field instanceof PDFDropdown ||
    field instanceof PDFOptionList
  );
}

function toText(value: PdfFieldValue): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function toBoolean(value: PdfFieldValue): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return ["1", "true", "yes", "on", "checked"].includes(value.trim().toLowerCase());
  }
  return false;
}

function toSelections(value: PdfFieldValue): string | string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  return toText(value);
}

function isProvided(value: PdfFieldValue): boolean {
  return value !== null && value !== undefined;
}

export function fillField(field: PDFField, value: PdfFieldValue): boolean {
  if (!isProvided(value) || field.isReadOnly()) return false;

  if (field instanceof PDFTextField) {
    field.setText(toText(value));
    return true;
  }

  if (field instanceof PDFCheckBox) {
    if (toBoolean(value)) field.check();
    else field.uncheck();
    return true;
  }

  if (field instanceof PDFRadioGroup) {
    const selection = toText(value);
    if (!selection) return false;
    field.select(selection);
    return true;
  }

  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    const selections = toSelections(value);
    if (Array.isArray(selections) && selections.length === 0) return false;
    if (!Array.isArray(selections) && !selections) return false;
    field.select(selections);
    return true;
  }

  return false;
}
