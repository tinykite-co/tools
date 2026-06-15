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
    },
    {
      id: "size",
      label: "Output size",
      type: "select",
      required: true,
      options: [
        { label: "Passport Seva (630 × 810 px)", value: "630x810" },
        { label: "2×2 inch / OCI (600 × 600 px)", value: "600x600" },
        { label: "35×45 mm alternate (413 × 531 px)", value: "413x531" }
      ]
    }
  ],
  runner: "@tinykite/image:indiaPassportPhotoTask",
  seo: {
    title: "India Passport & Visa Photo Generator",
    description: "Convert any portrait to official India passport/visa photo. Supports 630×810 px (default, 35×45 mm Passport Seva), 600×600 (2×2 inch OCI), and other sizes. Applies correct head-and-shoulders framing (just below the shoulders, ~80-85% coverage) with solid white background per government specifications.",
    summary: "Properly framed India passport photos at official pixel dimensions with accurate head and shoulders composition."
  }
};

export default tool;
