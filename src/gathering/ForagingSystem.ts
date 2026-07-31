import type { ResourceId } from "@/src/game/types";

export type ForageResource = Extract<
  ResourceId,
  "berry" | "herb" | "shell" | "glowcap" | "reed" | "starleaf" | "moonpetal" | "stardew"
>;

export interface ForageDiscovery {
  discoveryId: string;
  item: ForageResource;
  title: string;
  reading: string;
  note: string;
  amount: number;
}

const DISCOVERIES: Record<ForageResource, Omit<ForageDiscovery, "item">[]> = {
  berry: [
    { discoveryId: "berry-red", title: "あかい実", reading: "あかい み", note: "あまずっぱい、森のおやつ。", amount: 1 },
    { discoveryId: "berry-twin", title: "ふたごの実", reading: "ふたごの み", note: "ふたつならんだ、めずらしい実！", amount: 2 },
  ],
  herb: [
    { discoveryId: "herb-moon", title: "月のハーブ", reading: "つきの はーぶ", note: "夕方になると、いい香り。", amount: 1 },
    { discoveryId: "herb-star", title: "星の葉", reading: "ほしの は", note: "葉っぱに小さな星もよう。", amount: 2 },
  ],
  shell: [
    { discoveryId: "shell-striped", title: "しましま貝", reading: "しましま がい", note: "波の音がきこえる貝がら。", amount: 1 },
    { discoveryId: "shell-rainbow", title: "にじ色の貝", reading: "にじいろの かい", note: "光にかざすと七色にひかる！", amount: 2 },
  ],
  glowcap: [
    { discoveryId: "glowcap-light", title: "ひかりキノコ", reading: "ひかり きのこ", note: "夜の道をやさしく照らす。", amount: 1 },
    { discoveryId: "glowcap-firefly", title: "ほたるキノコ", reading: "ほたる きのこ", note: "小さな光がふわっと飛んだ！", amount: 2 },
  ],
  reed: [
    { discoveryId: "reed-water", title: "みずべ草", reading: "みずべ ぐさ", note: "しなやかで、ござ作りにぴったり。", amount: 1 },
    { discoveryId: "reed-silver", title: "銀のあし", reading: "ぎんの あし", note: "風がふくと銀色にゆれる。", amount: 2 },
  ],
  starleaf: [
    { discoveryId: "starleaf-islet", title: "星しずく草", reading: "ほししずく そう", note: "橋の先の風で、葉がきらめいた！", amount: 1 },
  ],
  moonpetal: [
    { discoveryId: "moonpetal-night", title: "月あかり花", reading: "つきあかり ばな", note: "夜だけ、月みたいに花がひらく。", amount: 1 },
  ],
  stardew: [
    { discoveryId: "stardew-night", title: "星つゆ草", reading: "ほしつゆ そう", note: "夜つゆが小さな星になった！", amount: 1 },
  ],
};

export function discoverForage(
  item: ForageResource,
  sourceId: string,
  day: number,
): ForageDiscovery {
  const choices = DISCOVERIES[item];
  const seed = [...`${sourceId}-${day}`].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return { ...choices[seed % choices.length], item };
}