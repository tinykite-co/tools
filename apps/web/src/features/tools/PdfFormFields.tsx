import type { PdfFieldValue, PdfFormField } from "@tinykite/pdf";
import { Input, Textarea } from "@tinykite/ui";
import type { CSSProperties, ChangeEvent } from "react";

export type PdfInspectStatus = "idle" | "loading" | "ready" | "error";

export function isFillablePdfField(field: PdfFormField): boolean {
  return (
    !field.readOnly &&
    ["text", "checkbox", "radio", "dropdown", "option-list"].includes(field.type)
  );
}

export function getInitialPdfFieldValue(field: PdfFormField): PdfFieldValue {
  if (field.type === "checkbox") return Boolean(field.value);
  if (field.type === "dropdown" || field.type === "option-list") {
    return Array.isArray(field.value) ? field.value : field.value ? [String(field.value)] : [];
  }
  return typeof field.value === "string" ? field.value : "";
}

const selectStyle: CSSProperties = {
  width: '100%',
  border: '1px solid var(--ru-color-border)',
  borderRadius: 'var(--ru-radius)',
  background: 'var(--ru-color-background)',
  color: 'var(--ru-color-foreground)',
  padding: '0.5rem 0.75rem',
  fontSize: '0.9rem'
};

export default function PdfFormFields({
  fields,
  values,
  status,
  error,
  onChange
}: {
  fields: PdfFormField[];
  values: Record<string, PdfFieldValue>;
  status: PdfInspectStatus;
  error: string | null;
  onChange: (name: string, value: PdfFieldValue) => void;
}): JSX.Element | null {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div style={{ padding: '14px 16px', border: '1px solid var(--ru-color-border)', borderRadius: 'var(--ru-radius)', color: 'var(--ru-color-muted-foreground)', fontSize: '0.9rem' }}>
        Reading PDF form fields...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ padding: '14px 16px', border: '1px solid #fecaca', borderRadius: 'var(--ru-radius)', background: '#fef2f2', color: '#b91c1c', fontSize: '0.9rem' }}>
        {error}
      </div>
    );
  }

  const fillableFields = fields.filter(isFillablePdfField);

  if (fillableFields.length === 0) {
    return (
      <div style={{ padding: '14px 16px', border: '1px solid var(--ru-color-border)', borderRadius: 'var(--ru-radius)', color: 'var(--ru-color-muted-foreground)', fontSize: '0.9rem' }}>
        No fillable fields were found in this PDF.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ru-color-foreground)' }}>PDF Fields</h3>
        <span style={{ color: 'var(--ru-color-muted-foreground)', fontSize: '0.82rem' }}>
          {fillableFields.length} field{fillableFields.length === 1 ? "" : "s"}
        </span>
      </div>

      {fillableFields.map((field) => (
        <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ru-color-foreground)' }}>
            {field.label}
            {field.required ? " *" : ""}
          </span>
          <PdfFormFieldInput
            field={field}
            value={values[field.name]}
            onChange={(value) => onChange(field.name, value)}
          />
        </label>
      ))}
    </div>
  );
}

function PdfFormFieldInput({
  field,
  value,
  onChange
}: {
  field: PdfFormField;
  value: PdfFieldValue;
  onChange: (value: PdfFieldValue) => void;
}): JSX.Element {
  if (field.type === "checkbox") {
    return (
      <Input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
        style={{ width: '18px', height: '18px' }}
      />
    );
  }

  if (field.type === "radio" || field.type === "dropdown") {
    const selected = Array.isArray(value) ? value[0] ?? "" : value ?? "";
    return (
      <select
        value={String(selected)}
        required={field.required}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        style={selectStyle}
      >
        <option value="">Select a value</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "option-list" && field.multiselect) {
    const selected = new Set(Array.isArray(value) ? value.map(String) : []);
    return (
      <select
        multiple
        value={[...selected]}
        required={field.required}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          onChange(Array.from(event.target.selectedOptions).map((option) => option.value));
        }}
        style={{ ...selectStyle, minHeight: '7rem' }}
      >
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "option-list") {
    const selected = Array.isArray(value) ? value[0] ?? "" : value ?? "";
    return (
      <select
        value={String(selected)}
        required={field.required}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        style={selectStyle}
      >
        <option value="">Select a value</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.multiline) {
    return (
      <Textarea
        rows={5}
        required={field.required}
        value={typeof value === "string" ? value : ""}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      />
    );
  }

  return (
    <Input
      type="text"
      required={field.required}
      value={typeof value === "string" ? value : ""}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
    />
  );
}
