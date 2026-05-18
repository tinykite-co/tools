import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "fill-pdf-form",
  title: "Fill PDF Form",
  category: "pdf",
  keywords: ["pdf", "form", "fillable", "editable", "acroform"],
  params: [
    {
      id: "pdf",
      label: "Editable PDF",
      type: "file",
      required: true,
      placeholder: "Upload a fillable PDF",
      accept: "application/pdf,.pdf"
    }
  ],
  runner: "@tinykite/pdf:fillPdfForm",
  seo: {
    title: "Fill Editable PDF Forms",
    description: "Upload a fillable PDF, enter values for its form fields, and download the completed PDF locally.",
    summary: "Fill editable PDF form fields in your browser and download the completed file."
  },
  onboarding: {
    key: "onboarding:fill-pdf-form",
    tips: ["Upload a PDF with editable form fields.", "Field values are processed locally in your browser."]
  }
};

export default tool;
