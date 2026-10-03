import { rmSync } from "node:fs";
import { join } from "node:path";

rmSync(join(process.cwd(), "dist", "client", "media-parts"), {
  recursive: true,
  force: true,
});
