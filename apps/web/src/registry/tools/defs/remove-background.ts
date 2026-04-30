import type { ToolDefinition } from "@tinykite/core";

const tool: ToolDefinition = {
  slug: "remove-background",
  title: "Remove Background",
  category: "image",
  keywords: ["image", "background", "remove", "transparent", "png", "logo"],
  params: [
    {
      id: "image",
      label: "Image to Process",
      type: "file",
      required: true,
      placeholder: "Upload an image"
    }
  ],
  runner: "@tinykite/image:removeBackgroundTask",
  seo: {
    title: "Remove Image Background",
    description: "Flawlessly remove the background from any image or logo right in your browser.",
    summary: "Instant, transparent background removal running entirely on your device."
  },
  onboarding: {
    key: "onboarding:remove-background",
    tips: [
      "Upload any image to automatically remove its background.",
      "Everything runs locally in your browser for complete privacy.",
      "Great for making logos transparent or extracting subjects."
    ]
  }
};

export default tool;
