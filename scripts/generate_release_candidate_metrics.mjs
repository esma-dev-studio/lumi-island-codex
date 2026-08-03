import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(root, "dist", "client");
const manifest = JSON.parse(
  readFileSync(path.join(clientRoot, ".vite", "manifest.json"), "utf8"),
);

const bytesFor = (file) => statSync(path.join(clientRoot, file)).size;
const entries = Object.values(manifest);
const jsFiles = [...new Set(entries.map((entry) => entry.file).filter((file) => file?.endsWith(".js")))];
const sizedJs = jsFiles
  .map((file) => ({ file, bytes: bytesFor(file) }))
  .sort((a, b) => b.bytes - a.bytes);

function collectStatic(key, found = new Set()) {
  if (!key || found.has(key) || !manifest[key]) return found;
  found.add(key);
  for (const dependency of manifest[key].imports ?? []) collectStatic(dependency, found);
  return found;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function countTests(directory, pattern) {
  return walk(path.join(root, directory))
    .filter((file) => file.endsWith(".ts"))
    .reduce(
      (count, file) => count + (readFileSync(file, "utf8").match(pattern) ?? []).length,
      0,
    );
}

const gameCanvasKey = Object.keys(manifest).find((key) => key === "src/ui/GameCanvas.tsx");
if (!gameCanvasKey) throw new Error("GameCanvas entry is missing from the production manifest");
const initialKeys = collectStatic(gameCanvasKey);
const initialFiles = [
  ...new Set(
    [...initialKeys]
      .map((key) => manifest[key].file)
      .filter((file) => file?.endsWith(".js")),
  ),
];
const dynamicRoots = [...new Set([...initialKeys].flatMap((key) => manifest[key].dynamicImports ?? []))];
const dynamicKeys = new Set();
for (const key of dynamicRoots) collectStatic(key, dynamicKeys);
const dynamicFiles = [
  ...new Set(
    [...dynamicKeys]
      .map((key) => manifest[key]?.file)
      .filter((file) => file?.endsWith(".js")),
  ),
];

const mediaFiles = walk(path.join(root, "public", "assets"));
const glbFiles = mediaFiles.filter((file) => file.endsWith(".glb"));
const audioFiles = mediaFiles.filter((file) => /\.(?:ogg|mp3|wav)$/i.test(file));
const screenshotNames = [
  "rc-title.png",
  "rc-tutorial-complete.png",
  "phase2-1-wood-game.png",
  "phase2-1-rock-game.png",
  "phase2-1-fishing-catch.png",
  "rc-first-purchase-area.png",
  "rc-collection-50.png",
  "rc-harbor-catch.png",
  "rc-harbor-catch-2.png",
  "rc-bridge-islet.png",
  "rc-collection-75.png",
  "rc-night-garden.png",
  "rc-collection-100.png",
  "rc-save-reload.png",
  "rc-tablet-landscape.png",
  "rc-tablet-touch.png",
];
const screenshots = Object.fromEntries(
  screenshotNames.map((name) => {
    const file = path.join(root, "screenshots", name);
    try {
      return [name, { present: true, bytes: statSync(file).size }];
    } catch {
      return [name, { present: false, bytes: 0 }];
    }
  }),
);
const characterGate = JSON.parse(
  readFileSync(path.join(root, "artifacts", "character-gate-phase2-3.json"), "utf8"),
);

const metrics = {
  phase: "release-candidate",
  generatedAt: new Date().toISOString(),
  tests: {
    unit: countTests("tests", /^\s*(?:it|test)\(/gm),
    e2e: countTests("e2e", /^\s*test\(/gm),
    emptySaveJourney: "e2e/release-candidate.spec.ts",
  },
  bundle: {
    manifestJsBytes: sizedJs.reduce((total, item) => total + item.bytes, 0),
    largestClientJs: sizedJs[0],
    gameCanvasInitialStaticBytes: initialFiles.reduce((total, file) => total + bytesFor(file), 0),
    gameCanvasInitialStaticFiles: initialFiles.length,
    gameCanvasDynamicBytes: dynamicFiles.reduce((total, file) => total + bytesFor(file), 0),
    gameCanvasDynamicFiles: dynamicFiles.length,
  },
  assets: {
    glb: {
      files: glbFiles.length,
      bytes: glbFiles.reduce((total, file) => total + statSync(file).size, 0),
    },
    audio: {
      files: audioFiles.length,
      bytes: audioFiles.reduce((total, file) => total + statSync(file).size, 0),
    },
  },
  characterGate: {
    validatorStatus: characterGate.validatorStatus,
    productionGateStatus: characterGate.productionGateStatus,
    passed: characterGate.passed,
  },
  screenshots,
};

writeFileSync(
  path.join(root, "artifacts", "release-candidate-metrics.json"),
  `${JSON.stringify(metrics, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(metrics, null, 2));
