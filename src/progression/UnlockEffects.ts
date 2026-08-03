import type { GameState } from "@/src/game/types";
import { advanceTime } from "@/src/game/gameState";

export interface RankAction {
  id: "start-morning" | "rest-evening" | "wait-night";
  label: string;
  description: string;
}

function advanceTo(state: GameState, targetMinute: number): GameState {
  const dayMinutes = 24 * 60;
  const minutes = (targetMinute - state.dayMinute + dayMinutes) % dayMinutes;
  return minutes === 0 ? state : advanceTime(state, minutes);
}

export function rankActions(state: GameState): RankAction[] {
  const actions: RankAction[] = [];
  if (state.islandLevel >= 2) {
    actions.push({
      id: "start-morning",
      label: "朝まで ぐっすり",
      description: "昼の生きものを さがせる",
    });
    actions.push({
      id: "rest-evening",
      label: "夕方まで ひと休み",
      description: "夕方の生きものを さがせる",
    });
  }
  if (state.islandLevel >= 3) {
    actions.push({
      id: "wait-night",
      label: "夜まで 待つ",
      description: "夜の花と魚を さがせる",
    });
  }
  return actions;
}

export function applyRankAction(
  state: GameState,
  actionId: RankAction["id"],
): GameState {
  if (actionId === "start-morning" && state.islandLevel >= 2) {
    return advanceTo(state, 8 * 60);
  }
  if (actionId === "rest-evening" && state.islandLevel >= 2) {
    return advanceTo(state, 17 * 60);
  }
  if (actionId === "wait-night" && state.islandLevel >= 3) {
    return advanceTo(state, 19 * 60);
  }
  return state;
}