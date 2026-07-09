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
    "iphone",
    "fast",
    "remux"
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
      label: "Speed",
      type: "select",
      required: true,
      options: [
        {
          label: "Fastest — remux if possible, else light re-encode (recommended)",
          value: "fast"
        },
        {
          label: "Re-encode — apply size & quality settings",
          value: "encode"
        }
      ]
    },
    {
      id: "format",
      label: "Output format (re-encode only; Fast always targets MP4)",
      type: "select",
      required: true,
      options: [
        { label: "MP4 (H.264) — fastest encode + best compatibility", value: "mp4" },
        { label: "WebM (VP9) — slower in browser, smaller sometimes", value: "webm" }
      ]
    },
    {
      id: "quality",
      label: "Quality (re-encode only)",
      type: "select",
      required: true,
      options: [
        { label: "Faster / smaller file (recommended for browser)", value: "55" },
        { label: "Balanced", value: "75" },
        { label: "Higher quality (slower, larger)", value: "90" }
      ]
    },
    {
      id: "maxHeight",
      label: "Max height (re-encode only)",
      type: "select",
      required: true,
      options: [
        { label: "720p — best speed/quality tradeoff", value: "720" },
        { label: "480p — fastest re-encode", value: "480" },
        { label: "1080p", value: "1080" },
        { label: "Original (slowest)", value: "original" }
      ]
    }
  ],
  runner: "@tinykite/video:convertVideoTask",
  seo: {
    title: "Convert Video Locally (MOV → MP4)",
    description:
      "Convert MOV, MKV, AVI, WebM and more to MP4 in your browser. Fast remux when possible; private — files never leave your device.",
    summary: "Browser-side video conversion optimized for speed (remux-first, ultrafast H.264)."
  },
  onboarding: {
    key: "convert-video-v2-fast",
    tips: [
      "Fastest mode remuxes (stream copy) when codecs already work — often near-instant for phone MOV → MP4.",
      "Re-encode only if you need to resize or the remux fails. Prefer MP4 + 720p over WebM/original.",
      "First run downloads a ~31MB video engine (cached afterwards)."
    ]
  }
};

export default tool;
