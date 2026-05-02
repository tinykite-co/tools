import { readFileSync } from "fs";
import { resolve } from "path";
import { appIconGeneratorTask } from "./apps/web/src/workers/tasks/image/app-icon-generator.js";

async function test() {
  const filePath = resolve("test_logo.png");
  let buffer;
  try {
    buffer = readFileSync(filePath);
  } catch(e) {
    console.error("test_logo.png not found, creating a dummy buffer");
    buffer = Buffer.from(new Uint8Array(10));
  }
  
  // Cast Buffer to ArrayBuffer
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  try {
    console.log("Running appIconGeneratorTask...");
    const result = await appIconGeneratorTask({
      image: arrayBuffer,
      filename: "test_logo.png"
    });
    console.log("Success! Generated assets:", result.assets.map(a => a.fileName));
  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

test();
