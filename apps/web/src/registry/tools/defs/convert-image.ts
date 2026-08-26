import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "convert-image",
  title: "Convert Image",
  category: "image",
  keywords: [
    "image",
    "convert",
    "svg",
    "png",
    "jpeg",
    "jpg",
    "webp",
    "format",
    "svg to png",
    "svg to jpeg",
    "vector"
  ],
  params: [
    {
      id: "image",
      label: "Image to Convert",
      type: "file",
      required: true,
      placeholder: "Upload an SVG, PNG, JPEG, WebP, or GIF image",
      accept: "image/*,.svg,.png,.jpg,.jpeg,.webp,.gif,.bmp"
    },
    {
      id: "format",
      label: "Output Format",
      type: "select",
      required: true,
      options: [
        { label: "PNG — Crisp & Transparent", value: "png" },
        { label: "JPEG — Lightweight Photo", value: "jpeg" },
        { label: "WebP — Modern Web Standard", value: "webp" },
        { label: "SVG — Scalable Vector Graphics", value: "svg" }
      ]
    },
    {
      id: "quality",
      label: "Quality (JPEG/WebP)",
      type: "select",
      required: false,
      options: [
        { label: "High (90%)", value: "0.9" },
        { label: "Maximum (100%)", value: "1.0" },
        { label: "Medium (75%)", value: "0.75" },
        { label: "Low (50%)", value: "0.5" }
      ]
    },
    {
      id: "backgroundColor",
      label: "Background Color (for JPEG)",
      type: "select",
      required: false,
      options: [
        { label: "White (#ffffff)", value: "#ffffff" },
        { label: "Transparent (PNG/WebP only)", value: "transparent" },
        { label: "Black (#000000)", value: "#000000" }
      ]
    }
  ],
  runner: "@tinykite/image:convertImageTask",
  seo: {
    title: "Convert SVG to PNG, JPEG, WebP | Private Online Image Converter",
    description:
      "Convert SVG to PNG, JPEG, WebP, or between image formats locally in your browser. Fast, free, and completely private.",
    summary: "Instant, private image format conversion directly in your browser."
  },
  onboarding: {
    key: "convert-image-v1",
    tips: [
      "Upload an SVG or image file, choose your output format, and convert instantly without uploading anything to the cloud."
    ]
  }
};

export default tool;
