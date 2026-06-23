import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "image-to-pdf",
  title: "Image to PDF",
  category: "pdf",
  keywords: ["image", "pdf", "convert", "jpg", "jpeg", "png", "to pdf", "images", "document"],
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
    description: "Convert one or more images (JPG, PNG, WebP, etc.) into a single PDF document entirely in your browser. Each image becomes a page sized to match the photo.",
    summary: "Fast, private images-to-PDF conversion. No uploads."
  },
  onboarding: {
    key: "onboarding:image-to-pdf",
    tips: [
      "Select multiple images to combine them into one PDF.",
      "Images are embedded at their original dimensions.",
      "Everything runs locally — your photos never leave your device."
    ]
  }
};

export default tool;
