import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "dist", "client", ".vite", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const clientRoot = path.join(root, "dist", "client");

const bytesFor = (file) => statSync(path.join(clientRoot, file)).size;
const uniqueFiles = [...new Set(Object.values(manifest).map((entry) => entry.file).filter(Boolean))];
const jsFiles = uniqueFiles.filter((file) => file.endsWith(".js"));
const sizedJs = jsFiles.map((file) => ({ file, bytes: bytesFor(file) })).sort((a, b) => b.bytes - a.bytes);

function collectStatic(key, found = new Set()) {
  if (!key || found.has(key) || !manifest[key]) return found;
  found.add(key);
  for (const dependency of manifest[key].imports ?? []) collectStatic(dependency, found);
  return found;
}

const gameCanvasKey = Object.keys(manifest).find((key) => key === "src/ui/GameCanvas.tsx");
if (!gameCanvasKey) throw new Error("GameCanvas entry is missing from the production manifest");
const initialKeys = collectStatic(gameCanvasKey);
const initialFiles = [...new Set([...initialKeys].map((key) => manifest[key].file).filter((file) => file?.endsWith(".js")))];
const initialBytes = initialFiles.reduce((total, file) => total + bytesFor(file), 0);
const dynamicRoots = [...new Set([...initialKeys].flatMap((key) => manifest[key].dynamicImports ?? []))];
const dynamicKeys = new Set();
for (const key of dynamicRoots) collectStatic(key, dynamicKeys);
const dynamicFiles = [...new Set([...dynamicKeys].map((key) => manifest[key]?.file).filter((file) => file?.endsWith(".js")))];
const dynamicBytes = dynamicFiles.reduce((total, file) => total + bytesFor(file), 0);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function countTests(directory, pattern) {
  return walk(path.join(root, directory))
    .filter((file) => file.endsWith(".ts"))
    .reduce((count, file) => count + (readFileSync(file, "utf8").match(pattern) ?? []).length, 0);
}

const sourceDirectories = ["app", "src", "tests", "e2e"];
const sourceFiles = sourceDirectories.flatMap((directory) => walk(path.join(root, directory)))
  .filter((file) => /\.(?:ts|tsx|css)$/.test(file));
const sourceLines = sourceFiles.reduce((count, file) => count + readFileSync(file, "utf8").split(/\r?\n/).length, 0);
const mediaFiles = walk(path.join(root, "public", "assets"));
const glbFiles = mediaFiles.filter((file) => file.endsWith(".glb"));
const audioFiles = mediaFiles.filter((file) => /\.(?:ogg|mp3|wav)$/i.test(file));
const requiredScreenshots = [
  "phase2-3-fresh-start.png",
  "phase2-3-child-menu.png",
  "phase2-3-grove-unlock.png",
  "phase2-3-reload.png",
];
const screenshotStatus = Object.fromEntries(requiredScreenshots.map((name) => {
  const file = path.join(root, "screenshots", name);
  try { return [name, { present: true, bytes: statSync(file).size }]; }
  catch { return [name, { present: false, bytes: 0 }]; }
}));
const characterGate = JSON.parse(readFileSync(path.join(root, "artifacts", "character-gate-phase2-3.json"), "utf8"));
const validation = JSON.parse(readFileSync(path.join(root, "artifacts", "phase2-3-validation.json"), "utf8"));

const metrics = {
  phase: "2.3",
  baselineCommit: "1f6f96ca2b7c1556ba39c1bf92f451ee1858f407",
  tests: {
    unit: countTests("tests", /^\s*(?:it|test)\(/gm),
    e2e: countTests("e2e", /^\s*test\(/gm),
    noSeedJourney: "e2e/phase2-3-journey.spec.ts",
  },
  code: { sourceFiles: sourceFiles.length, sourceLines },
  bundle: {
    baseline: { largestClientJsBytes: 5_471_685, clientJsWindowBytes: 7_425_909 },
    current: {
      manifestJsBytes: sizedJs.reduce((total, item) => total + item.bytes, 0),
      largestClientJs: sizedJs[0],
      gameCanvasInitialStaticBytes: initialBytes,
      gameCanvasInitialStaticFiles: initialFiles.length,
      gameCanvasDynamicBytes: dynamicBytes,
      gameCanvasDynamicFiles: dynamicFiles.length,
    },
    largestChunkReductionPercent: Number(((1 - sizedJs[0].bytes / 5_471_685) * 100).toFixed(1)),
  },
  assets: {
    glb: { files: glbFiles.length, bytes: glbFiles.reduce((total, file) => total + statSync(file).size, 0) },
    audio: { files: audioFiles.length, bytes: audioFiles.reduce((total, file) => total + statSync(file).size, 0) },
  },
  characterGate: {
    validatorStatus: characterGate.validatorStatus,
    productionGateStatus: characterGate.productionGateStatus,
    passed: characterGate.passed,
    visualReviewRequired: characterGate.visualReviewRequired,
  },
  validation: validation.checks,
  screenshots: screenshotStatus,
};

const output = path.join(root, "artifacts", "phase2-3-metrics.json");
writeFileSync(output, `${JSON.stringify(metrics, null, 2)}\n`, "utf8");
console.log(JSON.stringify(metrics, null, 2));