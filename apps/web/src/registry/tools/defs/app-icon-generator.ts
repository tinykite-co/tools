import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "app-icon-generator",
  title: "App Icon Generator",
  category: "image",
  keywords: ["app", "icon", "favicon", "ios", "android", "generate"],
  params: [
    {
      id: "image",
      label: "Source Image",
      type: "file",
      required: true,
      placeholder: "Upload AI generated image"
    }
  ],
  runner: "@tinykite/image:appIconGeneratorTask",
  seo: {
    title: "App Icon Generator Pro",
    description: "Automatically remove backgrounds, trim, and generate a complete suite of iOS, Android, and Web icons in a single click.",
    summary: "Turn any AI-generated image into a production-ready icon suite instantly."
  }
};

export default tool;
