import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(
  new URL("../node_modules/vinext/dist/cli.js", import.meta.url),
);
const build = spawnSync(process.execPath, [cliPath, "build"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env, LUMI_STATIC_EXPORT: "1" },
  stdio: "inherit",
});

if (build.error) throw build.error;

const indexHtmlUrl = new URL("../dist/client/index.html", import.meta.url);
let staticExportIsComplete = false;
try {
  const indexHtml = await readFile(indexHtmlUrl, "utf8");
  staticExportIsComplete =
    indexHtml.includes("Lumi Island") &&
    indexHtml.includes("self.__VINEXT_RSC_DONE__=true");
} catch {
  staticExportIsComplete = false;
}

if (build.status !== 0) {
  const knownWindowsPrerenderExit =
    process.platform === "win32" && staticExportIsComplete;
  if (!knownWindowsPrerenderExit) {
    process.exit(build.status ?? 1);
  }
  console.warn(
    "[sites] Vinext completed the static export before a known Windows prerender shutdown assertion.",
  );
}

if (!staticExportIsComplete) {
  throw new Error("Static export validation failed: dist/client/index.html is incomplete.");
}

await import("./rewrite_static_base_path.mjs");
await import("./finalize_sites_build.mjs");
