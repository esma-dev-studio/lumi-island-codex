import type { ResourceId } from "@/src/game/types";

export type ForageResource = Extract<
  ResourceId,
  "berry" | "herb" | "shell" | "glowcap" | "reed"
>;

export interface ForageDiscovery {
  discoveryId: string;
  item: ForageResource;
  title: string;
  reading: string;
  note: string;
  amount: number;
}

const DISCOVERIES: Record<ForageResource, Omit<ForageDiscovery, "discoveryId" | "item">[]> = {
  berry: [
    { title: "あかい実", reading: "あかい み", note: "あまずっぱい、森のおやつ。", amount: 1 },
    { title: "ふたごの実", reading: "ふたごの み", note: "ふたつならんだ、めずらしい実！", amount: 2 },
  ],
  herb: [
    { title: "月のハーブ", reading: "つきの はーぶ", note: "夕方になると、いい香り。", amount: 1 },
    { title: "星の葉", reading: "ほしの は", note: "葉っぱに小さな星もよう。", amount: 2 },
  ],
  shell: [
    { title: "しましま貝", reading: "しましま がい", note: "波の音がきこえる貝がら。", amount: 1 },
    { title: "にじ色の貝", reading: "にじいろの かい", note: "光にかざすと七色にひかる！", amount: 2 },
  ],
  glowcap: [
    { title: "ひかりキノコ", reading: "ひかり きのこ", note: "夜の道をやさしく照らす。", amount: 1 },
    { title: "ほたるキノコ", reading: "ほたる きのこ", note: "小さな光がふわっと飛んだ！", amount: 2 },
  ],
  reed: [
    { title: "みずべ草", reading: "みずべ ぐさ", note: "しなやかで、ござ作りにぴったり。", amount: 1 },
    { title: "銀のあし", reading: "ぎんの あし", note: "風がふくと銀色にゆれる。", amount: 2 },
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
  const choice = choices[seed % choices.length];
  return {
    ...choice,
    discoveryId: `${item}-${choice.title}`,
    item,
  };
}

