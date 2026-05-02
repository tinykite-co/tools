import React from "react";
import type { FieldSchema } from "@tinykite/ui-schema";
import { Input, Textarea, Select } from "@refraction-ui/react";

export interface FieldInputProps {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  compact?: boolean;
}

export function FieldInput({ field, value, onChange, compact }: FieldInputProps) {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.id}
        name={field.id}
        rows={compact ? 4 : 8}
        placeholder={field.placeholder}
        required={field.required}
        value={value}
        onChange={(event: any) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        id={field.id}
        name={field.id}
        value={value}
        required={field.required}
        onChange={(event: any) => onChange(event.target.value)}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "file") {
    return (
      <Input
        id={field.id}
        name={field.id}
        type="file"
        onChange={async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const buffer = await file.arrayBuffer();
            onChange({ image: buffer, filename: file.name });
          } else {
            onChange("");
          }
        }}
      />
    );
  }

  return (
    <Input
      id={field.id}
      name={field.id}
      type={field.type === "number" ? "number" : "text"}
      placeholder={field.placeholder}
      required={field.required}
      value={value}
        onChange={(event: any) => onChange(event.target.value)}
    />
  );
}
