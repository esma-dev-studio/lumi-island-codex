import { readFile, writeFile } from "node:fs/promises";

const wranglerConfigUrl = new URL("../dist/server/wrangler.json", import.meta.url);
const wranglerConfig = JSON.parse(await readFile(wranglerConfigUrl, "utf8"));

// As of 2026-08-04, nodejs_compat is enabled by default. Omitting the
// generated field also avoids deployment providers reapplying the obsolete flag.
if (
  Array.isArray(wranglerConfig.compatibility_flags) &&
  wranglerConfig.compatibility_flags.every((flag) => flag === "nodejs_compat")
) {
  delete wranglerConfig.compatibility_flags;
}

await writeFile(wranglerConfigUrl, `${JSON.stringify(wranglerConfig)}\n`, "utf8");
console.log("Finalized Sites worker compatibility metadata.");
