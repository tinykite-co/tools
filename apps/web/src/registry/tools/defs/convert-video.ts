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
    "iphone"
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
      id: "mode",
      label: "Feel",
      type: "select",
      required: true,
      options: [
        { label: "Effortless (recommended)", value: "fast" },
        { label: "I want control", value: "encode" }
      ]
    },
    {
      id: "format",
      label: "Format",
      type: "select",
      required: true,
      options: [
        { label: "MP4 — plays everywhere", value: "mp4" },
        { label: "WebM", value: "webm" }
      ]
    },
    {
      id: "quality",
      label: "Look",
      type: "select",
      required: true,
      options: [
        { label: "Light & quick", value: "55" },
        { label: "Balanced", value: "75" },
        { label: "Crisp", value: "90" }
      ]
    },
    {
      id: "maxHeight",
      label: "Size",
      type: "select",
      required: true,
      options: [
        { label: "720p — just right", value: "720" },
        { label: "480p — featherweight", value: "480" },
        { label: "1080p", value: "1080" },
        { label: "As-is", value: "original" }
      ]
    }
  ],
  runner: "@tinykite/video:convertVideoTask",
  seo: {
    title: "Convert Video — Private, Instant, In Your Browser",
    description:
      "Turn any recording into a clean MP4 without uploading a thing. Your video never leaves your device.",
    summary: "Any video. A perfect MP4. Nothing leaves your laptop."
  },
  onboarding: {
    key: "convert-video-awe-v1",
    tips: [
      "Drop a clip. Keep the defaults. Watch it transform — without sending a byte to the cloud."
    ]
  }
};

export default tool;
