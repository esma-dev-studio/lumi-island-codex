import fs from "node:fs";
import path from "node:path";

const inputDirectory = process.argv[2];
if (!inputDirectory) {
  throw new Error("Usage: node scripts/import_quaternius_characters.mjs <input-directory> [--reviewed]");
}
const reviewed = process.argv.includes("--reviewed");

const outputDirectory = path.resolve("public/assets/characters/models");
const characters = [
  { id: "mira", source: "Ranger.gltf", sourceName: "Ranger" },
  { id: "nolla", source: "Monk.gltf", sourceName: "Monk" },
  { id: "kai", source: "Rogue.gltf", sourceName: "Rogue" },
  { id: "sera", source: "Cleric.gltf", sourceName: "Cleric" },
];

function pad(buffer, fill = 0) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, fill)]) : buffer;
}

function toGlb(sourcePath) {
  const json = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (json.buffers?.length !== 1 || !json.buffers[0].uri?.startsWith("data:")) {
    throw new Error(`${sourcePath} is not a self-contained glTF`);
  }
  const comma = json.buffers[0].uri.indexOf(",");
  const binary = Buffer.from(json.buffers[0].uri.slice(comma + 1), "base64");
  delete json.buffers[0].uri;
  json.buffers[0].byteLength = binary.length;

  const jsonChunk = pad(Buffer.from(JSON.stringify(json), "utf8"), 0x20);
  const binaryChunk = pad(binary);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binaryChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binaryChunk.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return {
    buffer: Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, binaryChunk]),
    json,
  };
}

fs.mkdirSync(outputDirectory, { recursive: true });
const manifest = {
  generator: "scripts/import_quaternius_characters.mjs",
  source: {
    pack: "RPG Character Pack",
    author: "Quaternius",
    url: "https://quaternius.com/packs/rpgcharacters.html",
    license: "CC0 1.0",
  },
  characters: [],
};

for (const character of characters) {
  const sourcePath = path.resolve(inputDirectory, character.source);
  const outputPath = path.join(outputDirectory, `${character.id}.glb`);
  const { buffer, json } = toGlb(sourcePath);
  fs.writeFileSync(outputPath, buffer);
  manifest.characters.push({
    id: character.id,
    sourceModel: character.sourceName,
    path: `public/assets/characters/models/${character.id}.glb`,
    bytes: buffer.length,
    meshes: json.meshes?.length ?? 0,
    materials: json.materials?.length ?? 0,
    animations: json.animations?.map((animation) => animation.name) ?? [],
    assetStatus: reviewed ? "production-reviewed" : "production-candidate",
    visualReview: reviewed ? "passed" : "required",
  });
}

fs.writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`Imported ${characters.length} production CC0 characters.`);
