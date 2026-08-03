import { QUEST_ORDER, QUESTS } from "@/src/data/gameData";
import type { GameState } from "@/src/game/types";
import {
  dailyGoalIsActive,
  journeyGoalLabel,
} from "@/src/progression/DailyGoalSystem";
import { collectionCompletion } from "@/src/collection/CollectionSystem";

export interface PrimaryObjective {
  kind: "tutorial" | "request" | "daily" | "unlock";
  kicker: string;
  label: string;
  progressLabel: string;
  percent: number;
}

export function primaryObjective(state: GameState): PrimaryObjective {
  if (state.tutorialProgress.step < 7) {
    return {
      kind: "tutorial",
      kicker: "れんしゅう",
      label: "光のしるしを たどろう",
      progressLabel: `${state.tutorialProgress.step + 1}/7`,
      percent: ((state.tutorialProgress.step + 1) / 7) * 100,
    };
  }
  const firstPurchasePending =
    state.quests["first-kindling"].status === "complete" &&
    !state.bridgeRepaired &&
    state.groveRepairs === 0 &&
    !state.unlockedRecipes.includes("cedar-bench") &&
    state.unlockedCollectionHintIds.length === 0;
  if (firstPurchasePending) {
    return {
      kind: "unlock",
      kicker: "はじめての 島づくり",
      label: "島づくりを ひらいて 1つえらぼう",
      progressLabel: "メニュー → 島づくり",
      percent: 100,
    };
  }
  const activeQuestId = QUEST_ORDER.find(
    (id) => state.quests[id].status === "active",
  );
  if (activeQuestId) {
    const quest = QUESTS[activeQuestId];
    const progress = state.quests[activeQuestId];
    return {
      kind: "request",
      kicker: `${quest.resident}の おねがい`,
      label: quest.goalLabel,
      progressLabel: `${progress.amount}/${quest.target}`,
      percent: (progress.amount / quest.target) * 100,
    };
  }
  if (dailyGoalIsActive(state.dailyGoalsStartDay, state.day) && !state.journeyGoal.complete) {
    return {
      kind: "daily",
      kicker: "きょうの 島しごと",
      label: journeyGoalLabel(state.journeyGoal),
      progressLabel: `${state.journeyGoal.amount}/${state.journeyGoal.target}`,
      percent: (state.journeyGoal.amount / state.journeyGoal.target) * 100,
    };
  }
  const collection = collectionCompletion(state.collectionCounts);
  return {
    kind: "unlock",
    kicker: "つぎの お楽しみ",
    label: collection.percent >= 100
      ? state.residentFriendship["ノラ"] < 3
        ? "ずかん完成！ ノラと 作業場をつくろう"
        : "ずかん完成！ きょうの島しごとを楽しもう"
      : collection.percent < 50
        ? "ずかんを 50%にして 港をひらこう"
        : collection.percent < 75
          ? "ずかんを 75%にして 夜の庭をひらこう"
          : "まだ見ていない 生きものをさがそう",
    progressLabel: `${collection.found}/${collection.total}`,
    percent: collection.percent,
  };
}
