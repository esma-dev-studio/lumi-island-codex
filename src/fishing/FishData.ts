import type { FishHabitat } from "@/src/world/FishingSpotController";

export interface FishDefinition {
  id: string;
  name: string;
  reading: string;
  size: "ちいさい" | "ふつう" | "おおきい";
  discovery: string;
  habitat: FishHabitat;
}

export const FISH: FishDefinition[] = [
  {
    id: "lumi-minnow",
    name: "ルミメダカ",
    reading: "るみ めだか",
    size: "ちいさい",
    discovery: "しっぽが小さく光っている。",
    habitat: "pond",
  },
  {
    id: "moon-carp",
    name: "月コイ",
    reading: "つき こい",
    size: "おおきい",
    discovery: "まるい月のようなうろこ。",
    habitat: "pond",
  },
  {
    id: "ripple-perch",
    name: "なみもん魚",
    reading: "なみもん ざかな",
    size: "ふつう",
    discovery: "水の波みたいなしまもよう。",
    habitat: "pond",
  },
  {
    id: "lantern-goby",
    name: "ちょうちんハゼ",
    reading: "ちょうちん はぜ",
    size: "ちいさい",
    discovery: "おなかの光で 海の道をてらす。",
    habitat: "harbor",
  },
  {
    id: "glass-ray",
    name: "ガラスエイ",
    reading: "がらす えい",
    size: "おおきい",
    discovery: "すきとおる ひれで ゆっくり泳ぐ。",
    habitat: "harbor",
  },
];

export function fishForHabitat(habitat: FishHabitat): FishDefinition[] {
  return FISH.filter((fish) => fish.habitat === habitat);
}

export function chooseFish(
  seed: number,
  habitat: FishHabitat = "pond",
): FishDefinition {
  const normalized = Math.max(0, Math.min(0.999999, seed));
  const choices = fishForHabitat(habitat);
  return choices[Math.floor(normalized * choices.length)];
}