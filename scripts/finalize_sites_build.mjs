import { mkdir, rm, writeFile } from "node:fs/promises";

const serverDirUrl = new URL("../dist/server/", import.meta.url);
await rm(serverDirUrl, { recursive: true, force: true });
await mkdir(serverDirUrl, { recursive: true });

const workerSource = `export default {
  async fetch(request, env) {
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Lumi Island assets are unavailable.", { status: 503 });
  },
};
`;

const wranglerConfig = {
  name: "lumi-island",
  main: "index.js",
  compatibility_date: "2026-08-04",
  assets: {
    directory: "../client",
    binding: "ASSETS",
    not_found_handling: "single-page-application",
  },
};

await writeFile(new URL("index.js", serverDirUrl), workerSource, "utf8");
await writeFile(
  new URL("wrangler.json", serverDirUrl),
  `${JSON.stringify(wranglerConfig)}\n`,
  "utf8",
);
console.log("Finalized a static Sites worker without Node.js compatibility flags.");
