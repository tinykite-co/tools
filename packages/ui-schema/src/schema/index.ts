export type FieldType = "text" | "textarea" | "number" | "file" | "select";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldSchema {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  accept?: string;
  multiple?: boolean;
}

export interface UiSchema {
  fields: FieldSchema[];
}
