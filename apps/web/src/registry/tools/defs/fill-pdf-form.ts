import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "fill-pdf-form",
  title: "Fill PDF",
  category: "pdf",
  keywords: ["pdf", "form", "fillable", "editable", "acroform"],
  params: [
    {
      id: "pdf",
      label: "PDF",
      type: "file",
      required: true,
      placeholder: "Drop or upload a PDF",
      accept: "application/pdf,.pdf"
    }
  ],
  runner: "@tinykite/pdf:fillPdfForm",
  seo: {
    title: "Fill Editable PDF Forms",
    description: "Drop a PDF, fill any editable fields it contains, and download the completed PDF locally.",
    summary: "Fill editable PDF form fields in your browser and download the completed file."
  },
  onboarding: {
    key: "onboarding:fill-pdf-form",
    tips: ["Drop a PDF to load the document preview.", "Existing editable values are prefilled when the PDF provides them."]
  }
};

export default tool;
