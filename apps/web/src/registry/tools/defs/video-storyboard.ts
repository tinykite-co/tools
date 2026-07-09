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
    "extract",
    "claude",
    "screenshots",
    "timeline"
  ],
  params: [
    {
      id: "video",
      label: "Video file",
      type: "file",
      required: true,
      placeholder: "Upload a video",
      accept: VIDEO_ACCEPT
    },
    {
      id: "intervalSeconds",
      label: "Frame every…",
      type: "select",
      required: true,
      options: [
        { label: "2 seconds (recommended — fast overview)", value: "2" },
        { label: "5 seconds (quick glance)", value: "5" },
        { label: "1 second (detailed, slower)", value: "1" },
        { label: "10 seconds", value: "10" },
        { label: "0.5 seconds (dense, slowest)", value: "0.5" }
      ]
    },
    {
      id: "maxFrames",
      label: "Max frames",
      type: "select",
      required: true,
      options: [
        { label: "30 frames (recommended)", value: "30" },
        { label: "24 frames (fastest)", value: "24" },
        { label: "60 frames", value: "60" },
        { label: "90 frames", value: "90" }
      ]
    },
    {
      id: "layout",
      label: "Output layout",
      type: "select",
      required: true,
      options: [
        {
          label: "Contact sheet only — fastest + best for AI chat",
          value: "contact-sheet"
        },
        { label: "Individual frames", value: "frames" },
        { label: "Contact sheet + individual frames (slowest)", value: "both" }
      ]
    },
    {
      id: "includeTimestamps",
      label: "Timestamp labels",
      type: "select",
      required: true,
      options: [
        { label: "No (faster)", value: "false" },
        { label: "Yes (when building labeled sheets)", value: "true" }
      ]
    },
    {
      id: "maxWidth",
      label: "Frame width",
      type: "select",
      required: true,
      options: [
        { label: "640px (recommended — fast)", value: "640" },
        { label: "960px", value: "960" },
        { label: "1280px (sharper, slower)", value: "1280" }
      ]
    }
  ],
  runner: "@tinykite/video:videoStoryboardTask",
  seo: {
    title: "Video Storyboard — Extract Overview Frames",
    description:
      "Turn any video into a contact sheet or frame sequence in your browser. Tuned for fast overviews you can share with AI tools that accept images.",
    summary: "Private frame extraction and storyboard grids — defaults optimized for speed."
  },
  onboarding: {
    key: "video-storyboard-v2-fast",
    tips: [
      "Defaults (2s interval, 30 frames, 640px, contact sheet) are the fastest useful overview.",
      "Prefer contact sheet only — dumping many individual frames is slower and harder to use.",
      "First run downloads a ~31MB video engine (cached afterwards)."
    ]
  }
};

export default tool;
