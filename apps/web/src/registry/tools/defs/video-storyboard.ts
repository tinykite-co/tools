import type { ToolDefinition } from "@tinykite/core";
import { VIDEO_ACCEPT } from "@tinykite/video";

const tool: ToolDefinition = {
  slug: "video-storyboard",
  title: "Video Storyboard",
  category: "video",
  keywords: [
    "video",
    "storyboard",
    "frames",
    "thumbnail",
    "contact sheet",
    "overview",
    "screenshots",
    "timeline"
  ],
  params: [
    {
      id: "video",
      label: "Your video",
      type: "file",
      required: true,
      placeholder: "Drop a video here",
      accept: VIDEO_ACCEPT
    },
    {
      id: "intervalSeconds",
      label: "How often",
      type: "select",
      required: true,
      options: [
        { label: "Every 2 seconds", value: "2" },
        { label: "Every 5 seconds", value: "5" },
        { label: "Every second", value: "1" },
        { label: "Every 10 seconds", value: "10" },
        { label: "Every half second", value: "0.5" }
      ]
    },
    {
      id: "maxFrames",
      label: "How many moments",
      type: "select",
      required: true,
      options: [
        { label: "30 moments", value: "30" },
        { label: "24 moments", value: "24" },
        { label: "60 moments", value: "60" },
        { label: "90 moments", value: "90" }
      ]
    },
    {
      id: "layout",
      label: "How it arrives",
      type: "select",
      required: true,
      options: [
        { label: "One beautiful sheet", value: "contact-sheet" },
        { label: "Separate stills", value: "frames" },
        { label: "Sheet and stills", value: "both" }
      ]
    },
    {
      id: "includeTimestamps",
      label: "Time marks",
      type: "select",
      required: true,
      options: [
        { label: "Hide", value: "false" },
        { label: "Show", value: "true" }
      ]
    },
    {
      id: "maxWidth",
      label: "Clarity",
      type: "select",
      required: true,
      options: [
        { label: "Soft & light", value: "640" },
        { label: "Clear", value: "960" },
        { label: "Sharp", value: "1280" }
      ]
    }
  ],
  runner: "@tinykite/video:videoStoryboardTask",
  seo: {
    title: "Video Storyboard — See the Whole Story in Stills",
    description:
      "Unfold a video into a contact sheet of moments. Private, local, and ready to share as images.",
    summary: "One video in. The whole story, as stills — only on your device."
  },
  onboarding: {
    key: "video-storyboard-awe-v1",
    tips: [
      "A full recording becomes a single glanceable sheet of moments. Nothing is uploaded."
    ]
  }
};

export default tool;
