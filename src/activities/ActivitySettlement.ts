import type { ActivityResult } from "@/src/activities/ActivityResult";
import { collectionCompletion, registerActivityDiscovery } from "@/src/collection/CollectionSystem";
import { QUEST_ORDER, QUESTS } from "@/src/data/gameData";
import { gatherItem } from "@/src/game/gameState";
import type { GameState } from "@/src/game/types";
import { depleteResource } from "@/src/resources/ResourceStateSystem";
import { applyTutorialEventToState } from "@/src/tutorial/TutorialSystem";
import { TUTORIAL_TREE_SOURCE_ID } from "@/src/tutorial/TutorialSteps";
import type { FileSoundName } from "@/src/audio/FileAudioSystem";
import { applyCollectionMilestoneRewards } from "@/src/progression/ProgressionSystem";

export interface ActivitySettlement {
  state: GameState;
  message: string;
  sound: FileSoundName;
  collectionAction: boolean;
}

export function settleActivityResult(
  current: GameState,
  result: ActivityResult,
): ActivitySettlement {
  const beforeQuest = QUEST_ORDER.find(
    (id) => current.quests[id].status === "active",
  );
  const discoveryId = result.fishId ?? result.discoveryId;
  const firstDiscovery = Boolean(
    discoveryId && (current.collectionCounts[discoveryId] ?? 0) === 0,
  );
  const collectionBefore = collectionCompletion(current.collectionCounts);
  const groveQuestCompleted =
    result.sourceId === "glowcap-restored-grove-01" && !current.groveQuestComplete;
  const tutorialGather =
    current.tutorialProgress.step === 2 &&
    result.sourceId === TUTORIAL_TREE_SOURCE_ID &&
    result.activityType === "wood";
  const rewardItems = result.rewardItems.map((reward) =>
    tutorialGather && reward.itemId === "wood"
      ? { ...reward, quantity: Math.max(3, reward.quantity) }
      : reward,
  );

  let next = current;
  rewardItems.forEach((reward) => {
    next = gatherItem(next, reward.itemId, reward.quantity);
  });
  next = {
    ...next,
    discoveredItems:
      result.discoveryId && !next.discoveredItems.includes(result.discoveryId)
        ? [...next.discoveredItems, result.discoveryId]
        : next.discoveredItems,
    caughtFish:
      result.fishId && !next.caughtFish.includes(result.fishId)
        ? [...next.caughtFish, result.fishId]
        : next.caughtFish,
    collectionCounts: registerActivityDiscovery(next.collectionCounts, result),
    collectionFirstSeenDay:
      discoveryId && firstDiscovery
        ? { ...next.collectionFirstSeenDay, [discoveryId]: next.day }
        : next.collectionFirstSeenDay,
    fishingCatchCounts:
      result.fishId
        ? {
            ...next.fishingCatchCounts,
            [result.sourceId]: (next.fishingCatchCounts[result.sourceId] ?? 0) + 1,
          }
        : next.fishingCatchCounts,
    groveQuestComplete: current.groveQuestComplete || groveQuestCompleted,
    lumen: next.lumen + (groveQuestCompleted ? 6 : 0),
    resourceStates: depleteResource(
      next.resourceStates,
      result.sourceId,
      rewardItems[0]?.itemId ?? "wood",
      next.playSeconds,
    ),
  };
  next = applyTutorialEventToState(next, {
    type: "gather",
    sourceId: result.sourceId,
    item: rewardItems[0]?.itemId ?? "wood",
  });

  const questCompleted = Boolean(
    beforeQuest && next.quests[beforeQuest].status === "complete",
  );
  const collectionAfter = collectionCompletion(next.collectionCounts);
  const progression = applyCollectionMilestoneRewards(
    next,
    collectionBefore.percent,
    collectionAfter.percent,
  );
  next = progression.state;

  if (groveQuestCompleted) {
    return {
      state: next,
      message: "森のひみつ発見！ 6ルーメンを もらった",
      sound: "quest",
      collectionAction: true,
    };
  }
  if (progression.milestone) {
    return {
      state: next,
      message: `ずかん ${progression.milestone}%！ ${progression.rewardLabel}`,
      sound: "quest",
      collectionAction: true,
    };
  }
  if (firstDiscovery) {
    return {
      state: next,
      message: "はじめて発見！ ずかんに のったよ",
      sound: "quest",
      collectionAction: true,
    };
  }
  if (questCompleted && beforeQuest) {
    return {
      state: next,
      message: `依頼「${QUESTS[beforeQuest].title}」を達成！`,
      sound: "quest",
      collectionAction: false,
    };
  }
  return {
    state: next,
    message: tutorialGather ? "木のえだを 3こ集めた" : result.message,
    sound: "pickup",
    collectionAction: false,
  };
}
