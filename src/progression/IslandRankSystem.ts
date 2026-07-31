import { collectionCompletion } from "@/src/collection/CollectionSystem";
import { QUEST_ORDER } from "@/src/data/gameData";
import type { GameState, IslandRank } from "@/src/game/types";

export function calculateIslandRank(state: GameState): IslandRank {
  const completedQuests = QUEST_ORDER.filter(
    (id) => state.quests[id].status === "complete",
  ).length;
  const collectionFound = collectionCompletion(state.collectionCounts).found;
  const friendship = state.residentFriendship["ノラ"] ?? 0;
  const progressScore =
    completedQuests +
    Math.floor(collectionFound / 4) +
    Math.min(2, state.placedFurniture.length) +
    friendship;
  if (progressScore >= 6) return 3;
  if (progressScore >= 4) return 2;
  return 1;
}

export function withCalculatedRank(state: GameState): GameState {
  return { ...state, islandLevel: calculateIslandRank(state) };
}