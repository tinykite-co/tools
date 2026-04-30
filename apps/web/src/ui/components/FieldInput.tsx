import type { FieldSchema } from "@tinykite/ui-schema";
import { Textarea, Select, Input } from "@tinykite/ui";

export default function FieldInput({
  field,
  value,
  onChange,
  compact
}: {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  compact: boolean;
}) {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.id}
        name={field.id}
        rows={compact ? 4 : 8}
        placeholder={field.placeholder}
        required={field.required}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
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
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
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
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) {
            onChange({ image: file, filename: file.name });
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
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
    />
  );
}
