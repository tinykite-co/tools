import type { FieldSchema } from "@tinykite/ui-schema";
import { Textarea, Input } from "@tinykite/ui";

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
      <select
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
      </select>
    );
  }

  if (field.type === "file") {
    return (
      <Input
        id={field.id}
        name={field.id}
        type="file"
        accept={field.accept}
        multiple={field.multiple}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const fileList = event.target.files;
          if (!fileList || fileList.length === 0) {
            onChange("");
            return;
          }
          if (field.multiple) {
            const arr = Array.from(fileList).map((f) => ({ image: f, filename: f.name }));
            onChange(arr);
          } else {
            const file = fileList[0];
            onChange({ image: file, filename: file.name });
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
