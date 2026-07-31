import { COLLECTION_LUMEN_REWARDS } from "@/src/economy/EconomyConfig";
import type { GameState } from "@/src/game/types";
import { withCalculatedRank } from "@/src/progression/IslandRankSystem";

export function applyCollectionMilestoneRewards(
  state: GameState,
  beforePercent: number,
  afterPercent: number,
): { state: GameState; milestone: 25 | 50 | 75 | null; rewardLabel?: string } {
  const milestone = ([75, 50, 25] as const).find(
    (value) =>
      beforePercent < value &&
      afterPercent >= value &&
      !state.collectionMilestones.includes(value),
  );
  if (!milestone) return { state: withCalculatedRank(state), milestone: null };

  const unlockedRecipes =
    milestone === 25 && !state.unlockedRecipes.includes("harbor-sign")
      ? [...state.unlockedRecipes, "harbor-sign" as const]
      : state.unlockedRecipes;
  const rewardLabel =
    milestone === 25
      ? "港のしるべを 作れるようになった！"
      : milestone === 50
        ? "海辺の釣り場で 新しい魚がつれる！"
        : "夜の庭で 月の花を集められる！";
  const next = {
    ...state,
    lumen: state.lumen + COLLECTION_LUMEN_REWARDS[milestone],
    unlockedRecipes,
    collectionMilestones: [...state.collectionMilestones, milestone],
  };
  return { state: withCalculatedRank(next), milestone, rewardLabel };
}