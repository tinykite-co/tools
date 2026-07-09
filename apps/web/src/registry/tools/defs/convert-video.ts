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
    "transcode",
    "ffmpeg",
    "screen recording",
    "iphone"
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
      id: "format",
      label: "Output format",
      type: "select",
      required: true,
      options: [
        { label: "MP4 (H.264 + AAC) — best compatibility", value: "mp4" },
        { label: "WebM (VP9 + Opus)", value: "webm" }
      ]
    },
    {
      id: "quality",
      label: "Quality",
      type: "select",
      required: true,
      options: [
        { label: "Balanced (recommended)", value: "75" },
        { label: "High (larger file)", value: "90" },
        { label: "Smaller file", value: "55" }
      ]
    },
    {
      id: "maxHeight",
      label: "Max height",
      type: "select",
      required: true,
      options: [
        { label: "Original", value: "original" },
        { label: "1080p", value: "1080" },
        { label: "720p", value: "720" },
        { label: "480p", value: "480" }
      ]
    }
  ],
  runner: "@tinykite/video:convertVideoTask",
  seo: {
    title: "Convert Video Locally (MOV → MP4)",
    description:
      "Convert MOV, MKV, AVI, WebM and more to MP4 or WebM entirely in your browser. Private — files never leave your device.",
    summary: "Browser-side video conversion with H.264 MP4 and WebM output."
  },
  onboarding: {
    key: "convert-video-v1",
    tips: [
      "First run downloads a ~31MB video engine (cached afterwards).",
      "H.264 phone and screen recordings work best; ProRes/HEVC may be slow or fail.",
      "Everything runs locally — nothing is uploaded to a server."
    ]
  }
};

export default tool;
