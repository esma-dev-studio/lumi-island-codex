import type { FurnitureId, GameState } from "@/src/game/types";
import { ECONOMY_PRICES } from "@/src/economy/EconomyConfig";

export type LumenPurchase = "recipe" | "bridge" | "grove" | "hint";

export interface UnlockCatalogEntry {
  id: LumenPurchase;
  name: string;
  shortDescription: string;
  resultDescription: string;
}

export const UNLOCK_CATALOG: Record<LumenPurchase, UnlockCatalogEntry> = {
  recipe: {
    id: "recipe",
    name: "杉のベンチ",
    shortDescription: "作り方を おぼえる",
    resultDescription: "森で休める家具を作れる",
  },
  bridge: {
    id: "bridge",
    name: "小島への橋",
    shortDescription: "橋を なおす",
    resultDescription: "小島へ行けて、星しずく草を探せる",
  },
  grove: {
    id: "grove",
    name: "木もれ日の森",
    shortDescription: "森を げんきにする",
    resultDescription: "木や草と、集める場所がふえる",
  },
  hint: {
    id: "hint",
    name: "ずかんヒント",
    shortDescription: "場所を きく",
    resultDescription: "まだ見ていないものの場所が分かる",
  },
};

export const LUMEN_RECIPE: FurnitureId = "cedar-bench";

export function purchaseCost(state: GameState, use: LumenPurchase): number {
  if (use === "grove") {
    return ECONOMY_PRICES.grove[Math.min(state.groveRepairs, 2)];
  }
  return ECONOMY_PRICES[use];
}

export function purchaseComplete(state: GameState, use: LumenPurchase): boolean {
  if (use === "recipe") return state.unlockedRecipes.includes(LUMEN_RECIPE);
  if (use === "bridge") return state.bridgeRepaired;
  if (use === "grove") return state.groveRepairs >= ECONOMY_PRICES.grove.length;
  return false;
}