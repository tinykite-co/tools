import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "crop-image",
  title: "Crop Image",
  category: "image",
  keywords: ["image", "crop", "trim", "cut"],
  params: [
    {
      id: "image",
      label: "Image to Crop",
      type: "file",
      required: true,
      placeholder: "Upload an image"
    },
    {
      id: "x",
      label: "X Offset",
      type: "number",
      required: true,
      placeholder: "0"
    },
    {
      id: "y",
      label: "Y Offset",
      type: "number",
      required: true,
      placeholder: "0"
    },
    {
      id: "width",
      label: "Width",
      type: "number",
      required: true,
      placeholder: "e.g. 512"
    },
    {
      id: "height",
      label: "Height",
      type: "number",
      required: true,
      placeholder: "e.g. 512"
    }
  ],
  runner: "@tinykite/image:cropImage",
  seo: {
    title: "Crop Image",
    description: "Crop and trim images locally in your browser.",
    summary: "Fast, precise image cropping."
  }
};

export default tool;
