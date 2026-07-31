import type { QuestId } from "@/src/game/types";

export const INITIAL_LUMEN = 8;
export const DAILY_GOAL_REWARD = 10;

export const QUEST_LUMEN_REWARDS: Record<QuestId, number> = {
  "first-kindling": 12,
  "warm-light": 18,
  "sea-letter": 22,
  "herbal-tea": 24,
  "lighthouse-picnic": 30,
};

export const COLLECTION_LUMEN_REWARDS = {
  25: 8,
  50: 12,
  75: 18,
} as const;

export const ECONOMY_PRICES = {
  hint: 6,
  recipe: 18,
  bridge: 25,
  grove: [12, 18, 24] as const,
} as const;