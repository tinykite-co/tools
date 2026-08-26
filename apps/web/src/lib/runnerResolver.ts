import * as text from "@tinykite/text";
import * as pdf from "@tinykite/pdf";
import * as image from "@tinykite/image";
import * as zip from "@tinykite/zip";
import * as video from "@tinykite/video";
import { removeBackgroundTask } from "../workers/tasks/image/remove-background";
import { appIconGeneratorTask } from "../workers/tasks/image/app-icon-generator";
import { indiaPassportPhotoTask } from "../workers/tasks/image/india-passport-photo";
import { resizeImageTask } from "../workers/tasks/image/resize";
import { cropImageTask } from "../workers/tasks/image/crop";
import { convertImageTask } from "../workers/tasks/image/convert";
import { imagesToPdfTask } from "../workers/tasks/pdf/images-to-pdf";
import { convertVideoTask } from "../workers/tasks/video/convert";
import { videoStoryboardTask } from "../workers/tasks/video/storyboard";

const packageMap: Record<string, Record<string, unknown>> = {
  "@tinykite/text": text,
  "@tinykite/pdf": {
    ...pdf,
    imagesToPdfTask
  },
  "@tinykite/image": {
    ...image,
    removeBackgroundTask,
    appIconGeneratorTask,
    indiaPassportPhotoTask,
    resizeImageTask,
    cropImageTask,
    convertImageTask
  },
  "@tinykite/zip": zip,
  "@tinykite/video": {
    ...video,
    convertVideoTask,
    videoStoryboardTask
  }
};

export type RunnerFunction = (input: unknown) => unknown | Promise<unknown>;

export function resolveRunner(runner: string): RunnerFunction {
  const [pkg, exportName] = runner.split(":");
  const mod = packageMap[pkg ?? ""];
  if (!mod) {
    throw new Error(`Unknown runner package: ${pkg}`);
  }
  const candidate = mod[exportName ?? ""];
  if (typeof candidate !== "function") {
    throw new Error(`Runner not found: ${runner}`);
  }
  return candidate as RunnerFunction;
}
