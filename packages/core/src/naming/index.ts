import type { FieldSchema } from "@tinykite/ui-schema";

export interface ToolSeo {
  title: string;
  description: string;
  summary: string;
}

export interface ToolOnboarding {
  key: string;
  tips: string[];
}

export interface ToolDefinition {
  slug: string;
  title: string;
  category: string;
  keywords: string[];
  params: FieldSchema[];
  runner: string;
  seo: ToolSeo;
  onboarding?: ToolOnboarding;
}

export interface FlowSeo {
  title: string;
  description: string;
  summary: string;
}

export interface FlowDefinition {
  slug: string;
  title: string;
  steps: string[];
  seo: FlowSeo;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function deriveOutputName(
  inputName: string,
  suffix: string,
  ext: string
): string {
  const dotIndex = inputName.lastIndexOf(".");
  const base = dotIndex > 0 ? inputName.slice(0, dotIndex) : inputName;
  const sanitized = sanitizeFileName(base);
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  return `${sanitized}${suffix}${safeExt}`;
}

export function buildBatchName(
  toolSlug: string,
  index: number,
  ext: string
): string {
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  const padded = String(index).padStart(3, "0");
  return `${sanitizeFileName(toolSlug)}-${padded}${safeExt}`;
}
