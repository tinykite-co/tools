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
        { label: "1 second (detailed)", value: "1" },
        { label: "2 seconds", value: "2" },
        { label: "5 seconds (quick glance)", value: "5" },
        { label: "0.5 seconds (dense)", value: "0.5" },
        { label: "10 seconds", value: "10" }
      ]
    },
    {
      id: "maxFrames",
      label: "Max frames",
      type: "select",
      required: true,
      options: [
        { label: "60 frames", value: "60" },
        { label: "30 frames", value: "30" },
        { label: "90 frames", value: "90" },
        { label: "120 frames", value: "120" }
      ]
    },
    {
      id: "layout",
      label: "Output layout",
      type: "select",
      required: true,
      options: [
        {
          label: "Contact sheet (grid with timestamps) — best for AI chat",
          value: "contact-sheet"
        },
        { label: "Individual frames", value: "frames" },
        { label: "Contact sheet + individual frames", value: "both" }
      ]
    },
    {
      id: "includeTimestamps",
      label: "Timestamp labels (individual / both layouts)",
      type: "select",
      required: true,
      options: [
        { label: "Yes (when frames are extracted)", value: "true" },
        { label: "No", value: "false" }
      ]
    },
    {
      id: "maxWidth",
      label: "Frame width",
      type: "select",
      required: true,
      options: [
        { label: "1280px", value: "1280" },
        { label: "960px", value: "960" },
        { label: "640px", value: "640" }
      ]
    }
  ],
  runner: "@tinykite/video:videoStoryboardTask",
  seo: {
    title: "Video Storyboard — Extract Overview Frames",
    description:
      "Turn any video into a timestamped contact sheet or frame sequence in your browser. Ideal for understanding a recording at a glance or sharing with AI tools that accept images.",
    summary: "Private frame extraction and storyboard grids from video."
  },
  onboarding: {
    key: "video-storyboard-v1",
    tips: [
      "Contact sheets give a whole-video overview in one or a few images.",
      "Use ~1 frame/sec for short clips; 5s intervals for longer recordings.",
      "First run downloads a ~31MB video engine (cached afterwards)."
    ]
  }
};

export default tool;
