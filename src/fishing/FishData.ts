export interface FishDefinition {
  id: string;
  name: string;
  reading: string;
  size: "ちいさい" | "ふつう" | "おおきい";
  discovery: string;
}

export const FISH: FishDefinition[] = [
  {
    id: "lumi-minnow",
    name: "ルミメダカ",
    reading: "るみ めだか",
    size: "ちいさい",
    discovery: "しっぽが小さく光っている。",
  },
  {
    id: "moon-carp",
    name: "月コイ",
    reading: "つき こい",
    size: "おおきい",
    discovery: "まるい月のようなうろこ。",
  },
  {
    id: "ripple-perch",
    name: "なみもん魚",
    reading: "なみもん ざかな",
    size: "ふつう",
    discovery: "水の波みたいなしまもよう。",
  },
];

export function chooseFish(seed: number): FishDefinition {
  const normalized = Math.max(0, Math.min(0.999999, seed));
  return FISH[Math.floor(normalized * FISH.length)];
}

