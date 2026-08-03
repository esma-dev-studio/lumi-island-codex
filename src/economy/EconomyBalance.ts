export const ECONOMY_CHECKPOINTS = [
  { minute: 10, income: 12, source: "最初のおねがい" },
  { minute: 20, income: 18, source: "2つ目のおねがい" },
  { minute: 30, income: 22, source: "海辺のおねがい" },
  { minute: 40, income: 24, source: "お茶のおねがい" },
  { minute: 50, income: 30, source: "灯台のおねがい" },
  { minute: 65, income: 10, source: "毎日の島しごと" },
  { minute: 80, income: 10, source: "毎日の島しごと" },
] as const;

export type EconomyPlayStyle =
  | "fastest"
  | "standard"
  | "exploration"
  | "furniture"
  | "collection";

export const PLAY_STYLE_LABELS: Record<EconomyPlayStyle, string> = {
  fastest: "最短進行",
  standard: "標準",
  exploration: "探索中心",
  furniture: "家具中心",
  collection: "図かん中心",
};
