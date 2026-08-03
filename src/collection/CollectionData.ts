import { RESOURCE_WORLD_DEFINITIONS } from "@/src/resources/ResourceDefinitions";
import type { ResourceId } from "@/src/game/types";

function placeHint(item: ResourceId): string {
  return (
    RESOURCE_WORLD_DEFINITIONS.find((entry) => entry.item === item)?.placeHint ??
    "島のどこか"
  );
}

export type CollectionCategory = "fish" | "plant" | "shore";
export type CollectionVisual = "fish" | "berry" | "leaf" | "mushroom" | "reed" | "shell";

export interface CollectionEntry {
  id: string;
  category: CollectionCategory;
  name: string;
  reading: string;
  description: string;
  place: string;
  requires?: "harbor" | "bridge" | "night-garden";
  timeHint: string;
  visual: CollectionVisual;
  colors: readonly [string, string];
}

export const COLLECTION_ENTRIES: CollectionEntry[] = [
  { id: "lumi-minnow", category: "fish", name: "ルミメダカ", reading: "るみ めだか", description: "しっぽが 小さく光る さかな。", place: placeHint("fish"), timeHint: "昼に 見つけやすい", visual: "fish", colors: ["#f1c75b", "#4c908d"] },
  { id: "moon-carp", category: "fish", name: "月コイ", reading: "つき こい", description: "月みたいな まるいうろこ。", place: placeHint("fish"), timeHint: "夕方に 見つけやすい", visual: "fish", colors: ["#dc8d68", "#657ba5"] },
  { id: "ripple-perch", category: "fish", name: "なみもん魚", reading: "なみもん ざかな", description: "波のような しまもよう。", place: placeHint("fish"), timeHint: "いつでも", visual: "fish", colors: ["#75b8ad", "#315f71"] },
  { id: "lantern-goby", category: "fish", name: "ちょうちんハゼ", reading: "ちょうちん はぜ", description: "おなかの光で 海の道をてらす。", place: "海辺の釣りデッキ", timeHint: "いつでも", visual: "fish", colors: ["#f0b85b", "#315f71"], requires: "harbor" },
  { id: "glass-ray", category: "fish", name: "ガラスエイ", reading: "がらす えい", description: "すきとおる ひれで ゆっくり泳ぐ。", place: "海辺の釣りデッキ", timeHint: "夕方と夜", visual: "fish", colors: ["#9fd9df", "#657ba5"], requires: "harbor" },
  { id: "berry-red", category: "plant", name: "あかい実", reading: "あかい み", description: "あまずっぱい 森のおやつ。", place: placeHint("berry"), timeHint: "昼", visual: "berry", colors: ["#c75b4d", "#6f925c"] },
  { id: "berry-twin", category: "plant", name: "ふたごの実", reading: "ふたごの み", description: "ふたつ ならんだ めずらしい実。", place: placeHint("berry"), timeHint: "昼", visual: "berry", colors: ["#8f4561", "#75965d"] },
  { id: "herb-moon", category: "plant", name: "月のハーブ", reading: "つきの はーぶ", description: "夕方に いい香りがする。", place: placeHint("herb"), timeHint: "夕方", visual: "leaf", colors: ["#8ab46f", "#e8c268"] },
  { id: "herb-star", category: "plant", name: "星の葉", reading: "ほしの は", description: "小さな 星もようの 葉っぱ。", place: placeHint("herb"), timeHint: "昼", visual: "leaf", colors: ["#5d9976", "#f3db83"] },
  { id: "glowcap-light", category: "plant", name: "ひかりキノコ", reading: "ひかり きのこ", description: "夜道を やさしく照らす。", place: placeHint("glowcap"), timeHint: "夕方", visual: "mushroom", colors: ["#ecc864", "#9d6a52"] },
  { id: "glowcap-firefly", category: "plant", name: "ほたるキノコ", reading: "ほたる きのこ", description: "ほたるのような 光をまとう。", place: placeHint("glowcap"), timeHint: "夜", visual: "mushroom", colors: ["#b9d86b", "#6b5677"] },
  { id: "reed-water", category: "plant", name: "みずべ草", reading: "みずべ ぐさ", description: "しなやかな 水べの草。", place: placeHint("reed"), timeHint: "いつでも", visual: "reed", colors: ["#789b65", "#4b7f75"] },
  { id: "reed-silver", category: "plant", name: "銀のあし", reading: "ぎんの あし", description: "風で 銀色にゆれる草。", place: placeHint("reed"), timeHint: "夕方", visual: "reed", colors: ["#aebcb3", "#66856c"] },
  { id: "starleaf-islet", category: "plant", name: "星しずく草", reading: "ほししずく そう", description: "小島の風で 葉がきらめく。", place: placeHint("starleaf"), timeHint: "いつでも", visual: "leaf", colors: ["#8cc7a8", "#f3db83"], requires: "bridge" },
  { id: "moonpetal-night", category: "plant", name: "月あかり花", reading: "つきあかり ばな", description: "夜だけ 月みたいにひらく。", place: placeHint("moonpetal"), timeHint: "夜だけ", visual: "leaf", colors: ["#bca7ef", "#f2e8ff"], requires: "night-garden" },
  { id: "stardew-night", category: "plant", name: "星つゆ草", reading: "ほしつゆ そう", description: "夜つゆを 小さく光らせる。", place: placeHint("stardew"), timeHint: "夜だけ", visual: "reed", colors: ["#77cddd", "#dff9ff"], requires: "night-garden" },
  { id: "shell-striped", category: "shore", name: "しましま貝", reading: "しましま がい", description: "波の音が きこえる貝がら。", place: placeHint("shell"), timeHint: "昼", visual: "shell", colors: ["#dfa78f", "#8e655c"] },
  { id: "shell-rainbow", category: "shore", name: "にじ色の貝", reading: "にじいろの かい", description: "光にかざすと 七色にひかる。", place: placeHint("shell"), timeHint: "夕方", visual: "shell", colors: ["#d9a9c2", "#6fa9a1"] },
];

const LEGACY_COLLECTION_IDS: Record<string, string> = {
  "berry-あかい実": "berry-red",
  "berry-ふたごの実": "berry-twin",
  "herb-月のハーブ": "herb-moon",
  "herb-星の葉": "herb-star",
  "glowcap-ひかりキノコ": "glowcap-light",
  "glowcap-ほたるキノコ": "glowcap-firefly",
  "reed-みずべ草": "reed-water",
  "reed-銀のあし": "reed-silver",
  "shell-しましま貝": "shell-striped",
  "shell-にじ色の貝": "shell-rainbow",
};

export function stableCollectionId(id: string): string {
  return LEGACY_COLLECTION_IDS[id] ?? id;
}

export const COLLECTION_CATEGORIES: Array<{
  id: CollectionCategory | "all";
  label: string;
}> = [
  { id: "all", label: "ぜんぶ" },
  { id: "fish", label: "さかな" },
  { id: "plant", label: "草・実" },
  { id: "shore", label: "貝" },
];