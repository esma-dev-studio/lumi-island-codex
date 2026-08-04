import { readFile, rm } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distPath = fileURLToPath(new URL("../dist", import.meta.url));
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

if (packageJson.name !== "lumi-island" || basename(distPath) !== "dist" || dirname(distPath) !== projectRoot.replace(/[\\/]$/, "")) {
  throw new Error("Refusing to clean an unexpected build directory.");
}
await rm(distPath, { recursive: true, force: true });
