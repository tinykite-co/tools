import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "resize-image",
  title: "Resize Image",
  category: "image",
  keywords: ["image", "resize", "scale", "dimensions"],
  params: [
    {
      id: "image",
      label: "Image to Resize",
      type: "file",
      required: true,
      placeholder: "Upload an image"
    },
    {
      id: "width",
      label: "Width (px)",
      type: "number",
      required: true,
      placeholder: "e.g. 512"
    },
    {
      id: "height",
      label: "Height (px)",
      type: "number",
      required: true,
      placeholder: "e.g. 512"
    }
  ],
  runner: "@tinykite/image:resizeImage",
  seo: {
    title: "Resize Image Locally",
    description: "Instantly resize images to specific dimensions directly in your browser.",
    summary: "Fast, private image resizing without server uploads."
  }
};

export default tool;
