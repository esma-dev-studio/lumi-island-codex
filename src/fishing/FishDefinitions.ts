import type { FishHabitat } from "@/src/world/FishingSpotController";

export type FishActiveTime = "day" | "evening" | "night" | "any";
export type FishRarity = "common" | "uncommon" | "rare";

export interface FishDefinition {
  id: string;
  name: string;
  reading: string;
  size: "ちいさい" | "ふつう" | "おおきい";
  discovery: string;
  habitat: FishHabitat;
  activeTimes: readonly FishActiveTime[];
  rarity: FishRarity;
  baseWeight: number;
}

export const FISH_DEFINITIONS: readonly FishDefinition[] = [
  {
    id: "lumi-minnow",
    name: "ルミメダカ",
    reading: "るみ めだか",
    size: "ちいさい",
    discovery: "しっぽが小さく光っている。",
    habitat: "pond",
    activeTimes: ["day", "evening"],
    rarity: "common",
    baseWeight: 5,
  },
  {
    id: "moon-carp",
    name: "月コイ",
    reading: "つき こい",
    size: "おおきい",
    discovery: "まるい月のような色。",
    habitat: "pond",
    activeTimes: ["evening", "night"],
    rarity: "uncommon",
    baseWeight: 3,
  },
  {
    id: "ripple-perch",
    name: "なみもん魚",
    reading: "なみもん ざかな",
    size: "ふつう",
    discovery: "水の波みたいなしまもよう。",
    habitat: "pond",
    activeTimes: ["any"],
    rarity: "rare",
    baseWeight: 2,
  },
  {
    id: "lantern-goby",
    name: "ちょうちんハゼ",
    reading: "ちょうちん はぜ",
    size: "ちいさい",
    discovery: "おなかの光で 海の道をてらす。",
    habitat: "harbor",
    activeTimes: ["day", "evening"],
    rarity: "common",
    baseWeight: 4,
  },
  {
    id: "glass-ray",
    name: "ガラスエイ",
    reading: "がらす えい",
    size: "おおきい",
    discovery: "すきとおる ひれで ゆっくり泳ぐ。",
    habitat: "harbor",
    activeTimes: ["evening", "night"],
    rarity: "rare",
    baseWeight: 2,
  },
];

export function fishForHabitat(
  habitat: FishHabitat,
): readonly FishDefinition[] {
  return FISH_DEFINITIONS.filter((fish) => fish.habitat === habitat);
}
