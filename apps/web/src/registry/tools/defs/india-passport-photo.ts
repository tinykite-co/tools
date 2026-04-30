import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "india-passport-photo",
  title: "India Passport Photo Generator",
  category: "image",
  keywords: ["india", "passport", "photo", "visa", "citizenship"],
  params: [
    {
      id: "image",
      label: "Upload your portrait photo",
      type: "file",
      required: true,
      placeholder: "Select photo..."
    }
  ],
  runner: "@tinykite/image:indiaPassportPhotoTask",
  seo: {
    title: "India Passport & Visa Photo Generator",
    description: "Instantly convert any portrait into a perfectly sized 2x2 inch India Passport and Visa photo with a solid white background.",
    summary: "Automatically remove backgrounds and crop to exact India government requirements."
  }
};

export default tool;
