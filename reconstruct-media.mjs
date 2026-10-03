import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";

const partsDirectory = join(process.cwd(), "public", "media-parts", "live-walkthrough");
const outputPath = join(process.cwd(), "public", "media", "the-command-suite-live-walkthrough.mp4");

if (!existsSync(partsDirectory)) {
  throw new Error(`Missing media parts directory: ${partsDirectory}`);
}

const parts = readdirSync(partsDirectory)
  .filter((name) => name.endsWith(".part"))
  .sort();

if (!parts.length) {
  throw new Error("No walkthrough video parts were found.");
}

mkdirSync(dirname(outputPath), { recursive: true });
const output = createWriteStream(outputPath);

for (const part of parts) {
  await pipeline(createReadStream(join(partsDirectory, part)), output, { end: false });
}

output.end();
await new Promise((resolve, reject) => {
  output.once("finish", resolve);
  output.once("error", reject);
});
