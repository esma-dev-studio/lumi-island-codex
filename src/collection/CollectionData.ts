export type CollectionCategory = "fish" | "plant" | "shore";

export interface CollectionEntry {
  id: string;
  category: CollectionCategory;
  name: string;
  reading: string;
  description: string;
  place: string;
  timeHint: string;
  symbol: string;
}

export const COLLECTION_ENTRIES: CollectionEntry[] = [
  { id: "lumi-minnow", category: "fish", name: "ルミメダカ", reading: "るみ めだか", description: "しっぽが 小さく光る さかな。", place: "月の池", timeHint: "昼に 見つけやすい", symbol: "◀" },
  { id: "moon-carp", category: "fish", name: "月コイ", reading: "つき こい", description: "月みたいな まるいうろこ。", place: "月の池", timeHint: "夕方に 見つけやすい", symbol: "◆" },
  { id: "ripple-perch", category: "fish", name: "なみもん魚", reading: "なみもん ざかな", description: "波のような しまもよう。", place: "月の池", timeHint: "いつでも", symbol: "◁" },
  { id: "berry-あかい実", category: "plant", name: "あかい実", reading: "あかい み", description: "あまずっぱい 森のおやつ。", place: "森の木かげ", timeHint: "昼", symbol: "●" },
  { id: "berry-ふたごの実", category: "plant", name: "ふたごの実", reading: "ふたごの み", description: "ふたつ ならんだ めずらしい実。", place: "森の木かげ", timeHint: "昼", symbol: "●●" },
  { id: "herb-月のハーブ", category: "plant", name: "月のハーブ", reading: "つきの はーぶ", description: "夕方に いい香りがする。", place: "草原", timeHint: "夕方", symbol: "✦" },
  { id: "herb-星の葉", category: "plant", name: "星の葉", reading: "ほしの は", description: "小さな 星もようの 葉っぱ。", place: "草原", timeHint: "昼", symbol: "✤" },
  { id: "glowcap-ひかりキノコ", category: "plant", name: "ひかりキノコ", reading: "ひかり きのこ", description: "夜道を やさしく照らす。", place: "森の奥", timeHint: "夕方", symbol: "♢" },
  { id: "glowcap-ほたるキノコ", category: "plant", name: "ほたるキノコ", reading: "ほたる きのこ", description: "ほたるのような 光をまとう。", place: "森の奥", timeHint: "夜", symbol: "✧" },
  { id: "reed-みずべ草", category: "plant", name: "みずべ草", reading: "みずべ ぐさ", description: "しなやかな 水べの草。", place: "月の池のそば", timeHint: "いつでも", symbol: "〽" },
  { id: "reed-銀のあし", category: "plant", name: "銀のあし", reading: "ぎんの あし", description: "風で 銀色にゆれる草。", place: "月の池のそば", timeHint: "夕方", symbol: "⌇" },
  { id: "shell-しましま貝", category: "shore", name: "しましま貝", reading: "しましま がい", description: "波の音が きこえる貝がら。", place: "砂浜", timeHint: "昼", symbol: "◒" },
  { id: "shell-にじ色の貝", category: "shore", name: "にじ色の貝", reading: "にじいろの かい", description: "光にかざすと 七色にひかる。", place: "砂浜", timeHint: "夕方", symbol: "◓" },
];

export const COLLECTION_CATEGORIES: Array<{
  id: CollectionCategory | "all";
  label: string;
}> = [
  { id: "all", label: "ぜんぶ" },
  { id: "fish", label: "さかな" },
  { id: "plant", label: "草・実" },
  { id: "shore", label: "貝" },
];
