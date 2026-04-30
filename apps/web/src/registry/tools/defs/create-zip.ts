import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "create-zip",
  title: "Create Zip Bundle",
  category: "misc",
  keywords: ["zip", "archive", "compress", "bundle"],
  params: [
    {
      id: "files",
      label: "Files to Zip",
      type: "file",
      required: true,
      placeholder: "Upload multiple files"
    }
  ],
  runner: "@tinykite/zip:zipOutputs",
  seo: {
    title: "Create Zip Archive",
    description: "Compress multiple files into a single zip bundle locally.",
    summary: "Fast local zip compression."
  }
};

export default tool;
