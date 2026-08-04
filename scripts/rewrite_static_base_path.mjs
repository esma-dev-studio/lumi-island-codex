import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

const rawBasePath = process.env.LUMI_STATIC_BASE_PATH ?? "";
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/$/, "");
const clientDirUrl = new URL("../dist/client/", import.meta.url);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".rsc"]);

async function rewriteDirectory(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  for (const entry of entries) {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directoryUrl);
    if (entry.isDirectory()) {
      await rewriteDirectory(entryUrl);
      continue;
    }
    if (!textExtensions.has(extname(entry.name))) continue;

    const original = await readFile(entryUrl, "utf8");
    const protectedPrefix = "__LUMI_PUBLIC_ASSET_PREFIX__/";
    const rewritten = original
      .replaceAll(`${basePath}/assets/`, protectedPrefix)
      .replaceAll("/assets/", `${basePath}/assets/`)
      .replaceAll(protectedPrefix, `${basePath}/assets/`);
    if (rewritten !== original) await writeFile(entryUrl, rewritten, "utf8");
  }
}

if (basePath) {
  if (!basePath.startsWith("/")) {
    throw new Error("LUMI_STATIC_BASE_PATH must start with a slash.");
  }
  await rewriteDirectory(clientDirUrl);
  console.log(`Rewrote static assets for ${basePath}.`);
}
