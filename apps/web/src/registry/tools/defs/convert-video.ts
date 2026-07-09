import type { ToolDefinition } from "@tinykite/core";
import { VIDEO_ACCEPT } from "@tinykite/video";

const tool: ToolDefinition = {
  slug: "convert-video",
  title: "Convert Video",
  category: "video",
  keywords: [
    "video",
    "convert",
    "mov",
    "mp4",
    "webm",
    "mkv",
    "avi",
    "screen recording",
    "iphone",
    "fast"
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
      id: "mode",
      label: "Priority",
      type: "select",
      required: true,
      options: [
        {
          label: "Speed (recommended)",
          value: "fast"
        },
        {
          label: "Custom size & quality",
          value: "encode"
        }
      ]
    },
    {
      id: "format",
      label: "Format",
      type: "select",
      required: true,
      options: [
        { label: "MP4 — works almost everywhere", value: "mp4" },
        { label: "WebM", value: "webm" }
      ]
    },
    {
      id: "quality",
      label: "Quality",
      type: "select",
      required: true,
      options: [
        { label: "Smaller file (recommended)", value: "55" },
        { label: "Balanced", value: "75" },
        { label: "Higher quality", value: "90" }
      ]
    },
    {
      id: "maxHeight",
      label: "Resolution",
      type: "select",
      required: true,
      options: [
        { label: "720p (recommended)", value: "720" },
        { label: "480p", value: "480" },
        { label: "1080p", value: "1080" },
        { label: "Keep original", value: "original" }
      ]
    }
  ],
  runner: "@tinykite/video:convertVideoTask",
  seo: {
    title: "Convert Video Locally (MOV → MP4)",
    description:
      "Convert MOV, MKV, AVI, WebM and more to MP4 right in your browser. Private — your files never leave your device.",
    summary: "Convert videos privately in your browser — fast by default."
  },
  onboarding: {
    key: "convert-video-v3",
    tips: [
      "Speed mode is usually enough for phone recordings and screen captures.",
      "Choose Custom size & quality only when you need a specific resolution or smaller file.",
      "The first conversion may take a moment to prepare; later runs are quicker."
    ]
  }
};

export default tool;
