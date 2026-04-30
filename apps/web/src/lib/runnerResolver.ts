import * as text from "@tinykite/text";
import * as pdf from "@tinykite/pdf";
import * as image from "@tinykite/image";
import * as zip from "@tinykite/zip";
import { removeBackgroundTask } from "../workers/tasks/image/remove-background";
import { appIconGeneratorTask } from "../workers/tasks/image/app-icon-generator";
import { indiaPassportPhotoTask } from "../workers/tasks/image/india-passport-photo";

const packageMap: Record<string, Record<string, unknown>> = {
  "@tinykite/text": text,
  "@tinykite/pdf": pdf,
  "@tinykite/image": {
    ...image,
    removeBackgroundTask,
    appIconGeneratorTask,
    indiaPassportPhotoTask
  },
  "@tinykite/zip": zip
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
