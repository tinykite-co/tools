import {
  PDFButton,
  PDFCheckBox,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField
} from "pdf-lib";

import type { PdfFormField, PdfFormFieldType } from "./types";

function getFieldType(field: PDFField): PdfFormFieldType {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFDropdown) return "dropdown";
  if (field instanceof PDFOptionList) return "option-list";
  if (field instanceof PDFButton) return "button";
  if (field instanceof PDFSignature) return "signature";
  return "unknown";
}

function getFieldLabel(name: string): string {
  const partialName = name.split(".").at(-1) ?? name;
  return partialName
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (first) => first.toUpperCase()) || name;
}

function getFieldValue(field: PDFField): PdfFormField["value"] {
  if (field instanceof PDFTextField) return field.getText() ?? "";
  if (field instanceof PDFCheckBox) return field.isChecked();
  if (field instanceof PDFRadioGroup) return field.getSelected() ?? "";
  if (field instanceof PDFDropdown) return field.getSelected();
  if (field instanceof PDFOptionList) return field.getSelected();
  return undefined;
}

function getFieldOptions(field: PDFField): string[] | undefined {
  if (
    field instanceof PDFRadioGroup ||
    field instanceof PDFDropdown ||
    field instanceof PDFOptionList
  ) {
    return field.getOptions();
  }

  return undefined;
}

export function toFormField(field: PDFField): PdfFormField {
  return {
    name: field.getName(),
    label: getFieldLabel(field.getName()),
    type: getFieldType(field),
    value: getFieldValue(field),
    options: getFieldOptions(field),
    required: field.isRequired(),
    readOnly: field.isReadOnly(),
    multiline: field instanceof PDFTextField ? field.isMultiline() : undefined,
    multiselect:
      field instanceof PDFDropdown || field instanceof PDFOptionList
        ? field.isMultiselect()
        : undefined
  };
}
