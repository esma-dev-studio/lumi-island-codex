import { createInitialState } from "@/src/game/gameState";
import { spendLumen } from "@/src/economy/EconomySystem";
import type { LumenPurchase } from "@/src/economy/UnlockCatalog";
import {
  ECONOMY_CHECKPOINTS,
  type EconomyPlayStyle,
} from "@/src/economy/EconomyBalance";

const ORDERS: Record<EconomyPlayStyle, readonly LumenPurchase[]> = {
  fastest: ["hint", "bridge", "grove", "recipe", "grove"],
  standard: ["hint", "recipe", "bridge", "grove", "grove"],
  exploration: ["hint", "grove", "bridge", "grove", "grove"],
  furniture: ["recipe", "hint", "grove", "bridge", "grove"],
  collection: ["hint", "hint", "bridge", "grove", "recipe"],
};

export interface EconomyPurchaseRecord {
  minute: number;
  purchase: LumenPurchase;
  cost: number;
  remainingLumen: number;
}

export interface EconomySimulationResult {
  style: EconomyPlayStyle;
  purchases: EconomyPurchaseRecord[];
  blocked: boolean;
  endingLumen: number;
}

export function simulateEconomy(
  style: EconomyPlayStyle,
): EconomySimulationResult {
  let state = createInitialState();
  const queue = [...ORDERS[style]];
  const purchases: EconomyPurchaseRecord[] = [];
  for (const checkpoint of ECONOMY_CHECKPOINTS) {
    state = { ...state, lumen: state.lumen + checkpoint.income };
    const wanted = queue[0];
    if (!wanted) continue;
    const before = state.lumen;
    const result = spendLumen(state, wanted);
    if (!result.ok) continue;
    state = result.state;
    queue.shift();
    purchases.push({
      minute: checkpoint.minute,
      purchase: wanted,
      cost: before - state.lumen,
      remainingLumen: state.lumen,
    });
  }
  return {
    style,
    purchases,
    blocked: purchases.length < 2,
    endingLumen: state.lumen,
  };
}

export function simulateAllEconomyStyles(): EconomySimulationResult[] {
  return (
    ["fastest", "standard", "exploration", "furniture", "collection"] as const
  ).map(simulateEconomy);
}
