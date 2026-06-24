import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "image-to-pdf",
  title: "Image to PDF",
  category: "pdf",
  keywords: ["image", "pdf", "convert", "jpg", "jpeg", "png", "to pdf", "images", "document", "batch"],
  params: [
    {
      id: "images",
      label: "Images",
      type: "file",
      required: true,
      multiple: true,
      placeholder: "Select one or more images (PNG, JPG, etc.)",
      accept: "image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp"
    }
  ],
  runner: "@tinykite/pdf:imagesToPdfTask",
  seo: {
    title: "Image to PDF Converter",
    description: "Convert one or more images (JPG, PNG, WebP, etc.) into a multi-page PDF entirely in your browser. Each image becomes a page sized to the original photo.",
    summary: "Convert one or more images into a multi-page PDF. Runs 100% locally with no uploads."
  },
  onboarding: {
    key: "onboarding:image-to-pdf",
    tips: [
      "Select multiple images — each becomes one page in the PDF.",
      "Pages are sized to match the original image dimensions.",
      "Everything runs locally — your photos never leave your device."
    ]
  }
};

export default tool;
