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
        { label: "2 seconds (recommended)", value: "2" },
        { label: "5 seconds", value: "5" },
        { label: "1 second", value: "1" },
        { label: "10 seconds", value: "10" },
        { label: "0.5 seconds", value: "0.5" }
      ]
    },
    {
      id: "maxFrames",
      label: "Max frames",
      type: "select",
      required: true,
      options: [
        { label: "30 frames (recommended)", value: "30" },
        { label: "24 frames", value: "24" },
        { label: "60 frames", value: "60" },
        { label: "90 frames", value: "90" }
      ]
    },
    {
      id: "layout",
      label: "Output",
      type: "select",
      required: true,
      options: [
        { label: "Contact sheet (recommended)", value: "contact-sheet" },
        { label: "Individual frames", value: "frames" },
        { label: "Contact sheet and individual frames", value: "both" }
      ]
    },
    {
      id: "includeTimestamps",
      label: "Show timestamps",
      type: "select",
      required: true,
      options: [
        { label: "No", value: "false" },
        { label: "Yes", value: "true" }
      ]
    },
    {
      id: "maxWidth",
      label: "Frame width",
      type: "select",
      required: true,
      options: [
        { label: "640px (recommended)", value: "640" },
        { label: "960px", value: "960" },
        { label: "1280px", value: "1280" }
      ]
    }
  ],
  runner: "@tinykite/video:videoStoryboardTask",
  seo: {
    title: "Video Storyboard — Extract Overview Frames",
    description:
      "Turn any video into a contact sheet or set of stills in your browser. Private overview images you can download and share.",
    summary: "Get a visual overview of a video as stills — privately, in your browser."
  },
  onboarding: {
    key: "video-storyboard-v3",
    tips: [
      "A contact sheet is usually enough to see the whole video at a glance.",
      "Use a longer interval for longer recordings so the overview stays manageable.",
      "The first run may take a moment to prepare; later runs are quicker."
    ]
  }
};

export default tool;
