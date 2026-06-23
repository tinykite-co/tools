import { registerHandler } from "../rpc/workerServer";
import { mergePdfTask } from "../tasks/pdf/merge";
import { imagesToPdfTask } from "../tasks/pdf/images-to-pdf";

registerHandler(mergePdfTask);
registerHandler(imagesToPdfTask);
