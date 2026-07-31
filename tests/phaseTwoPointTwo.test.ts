import { describe, expect, it } from "vitest";
import {
  activityInputIntent,
  nextChoiceIndex,
} from "@/src/activities/ActivityInputController";
import {
  FREE_PLAYER_ACTION,
  animatePlayerActivity,
  isPlayerMovementLocked,
  preparePlayerActivity,
  rewardPlayerActivity,
} from "@/src/player/PlayerActionController";
import {
  applyTutorialEvent,
  createTutorialProgress,
} from "@/src/tutorial/TutorialSystem";
import {
  TUTORIAL_TREE_SOURCE_ID,
} from "@/src/tutorial/TutorialSteps";
import { advanceFootstepCadence } from "@/src/audio/FootstepCadence";
import {
  RESOURCE_WORLD_DEFINITIONS,
  stableResourceId,
} from "@/src/resources/ResourceDefinitions";
import { sanitizeResourceStates } from "@/src/resources/ResourceStateSystem";
import {
  crossedCollectionMilestone,
  migrateCollectionIds,
} from "@/src/collection/CollectionSystem";
import { COLLECTION_ENTRIES } from "@/src/collection/CollectionData";
import { createInitialState } from "@/src/game/gameState";
import {
  applyCollectionMilestoneRewards,
  applyJourneyEvent,
  befriendResident,
  calculateIslandRank,
  spendLumen,
} from "@/src/progression/ProgressionSystem";

describe("Phase 2.2 activity input", () => {
  it("maps the documented keys to one activity intent", () => {
    expect(activityInputIntent("KeyE")).toBe("primary");
    expect(activityInputIntent("Space")).toBe("primary");
    expect(activityInputIntent("Enter")).toBe("confirm");
    expect(activityInputIntent("Escape")).toBe("cancel");
    expect(activityInputIntent("ArrowLeft")).toBe("previous");
    expect(activityInputIntent("ArrowRight")).toBe("next");
    expect(activityInputIntent("Tab")).toBe("tab");
  });

  it("ignores repeated primary keydown events", () => {
    expect(activityInputIntent("KeyE", true)).toBeNull();
    expect(activityInputIntent("Space", true)).toBeNull();
    expect(activityInputIntent("Enter", true)).toBeNull();
  });

  it("wraps roving choice focus in both directions", () => {
    expect(nextChoiceIndex(2, "next", 3)).toBe(0);
    expect(nextChoiceIndex(0, "previous", 3)).toBe(2);
  });
});

describe("Phase 2.2 player action state", () => {
  const result = {
    activityType: "wood" as const,
    sourceId: "tree-tutorial",
    grade: "good" as const,
    rewardItems: [{ itemId: "wood" as const, quantity: 1 }],
    message: "木のえだを 1こ あつめた",
  };

  it("locks movement from prepare through reward", () => {
    const prepare = preparePlayerActivity("wood", result.sourceId);
    const animate = animatePlayerActivity(result);
    const reward = rewardPlayerActivity(animate);

    expect(isPlayerMovementLocked(prepare)).toBe(true);
    expect(isPlayerMovementLocked(animate)).toBe(true);
    expect(isPlayerMovementLocked(reward)).toBe(true);
    expect(isPlayerMovementLocked(FREE_PLAYER_ACTION)).toBe(false);
  });

  it("preserves activity identity across settlement phases", () => {
    expect(animatePlayerActivity(result)).toEqual({
      type: "activity",
      activity: "wood",
      sourceId: "tree-tutorial",
      phase: "animate",
    });
    expect(rewardPlayerActivity(animatePlayerActivity(result))).toMatchObject({
      sourceId: "tree-tutorial",
      phase: "reward",
    });
  });
});
describe("Phase 2.2 target-dependent tutorial", () => {
  it("advances the tree hint only for the highlighted tutorial tree", () => {
    const progress = { ...createTutorialProgress(1), walkedDistance: 3 };
    const wrong = applyTutorialEvent(progress, {
      type: "hint",
      sourceId: "rock-cluster-0",
      item: "stone",
    });
    expect(wrong).toBe(progress);

    const correct = applyTutorialEvent(progress, {
      type: "hint",
      sourceId: TUTORIAL_TREE_SOURCE_ID,
      item: "wood",
    });
    expect(correct.step).toBe(2);
  });

  it("rejects the wrong resource, furniture, and resident", () => {
    const gather = { ...createTutorialProgress(2), walkedDistance: 3 };
    expect(
      applyTutorialEvent(gather, {
        type: "gather",
        sourceId: "cedar-tree-0",
        item: "wood",
      }),
    ).toBe(gather);
    expect(
      applyTutorialEvent(gather, {
        type: "gather",
        sourceId: TUTORIAL_TREE_SOURCE_ID,
        item: "wood",
      }).step,
    ).toBe(3);

    const craft = createTutorialProgress(4);
    expect(applyTutorialEvent(craft, { type: "craft", item: "stone-lantern" })).toBe(craft);
    expect(applyTutorialEvent(craft, { type: "craft", item: "twig-stool" }).step).toBe(5);

    const talk = createTutorialProgress(6);
    expect(applyTutorialEvent(talk, { type: "talk", resident: "カイ" })).toBe(talk);
    expect(applyTutorialEvent(talk, { type: "talk", resident: "ノラ" }).step).toBe(7);
  });
});
describe("Phase 2.2 audio and stable world data", () => {
  it("requests footsteps only while moving and shortens the running cadence", () => {
    expect(advanceFootstepCadence(0, 0.1, false, false, false)).toEqual({
      timer: 0,
      shouldPlay: false,
    });
    expect(advanceFootstepCadence(0, 0.1, true, false, false)).toEqual({
      timer: 0.36,
      shouldPlay: true,
    });
    expect(advanceFootstepCadence(0, 0.1, true, true, false)).toEqual({
      timer: 0.24,
      shouldPlay: true,
    });
    expect(advanceFootstepCadence(0, 0.1, true, true, true).shouldPlay).toBe(false);
  });

  it("uses unique ASCII resource ids and migrates legacy node names", () => {
    const ids = RESOURCE_WORLD_DEFINITIONS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9-]+$/.test(id))).toBe(true);
    expect(stableResourceId("cedar-tree-1")).toBe("wood-cedar-02");
    const migrated = sanitizeResourceStates({
      "cedar-tree-1": {
        resourceId: "cedar-tree-1",
        state: "depleted",
        visualStage: 1,
      },
    });
    expect(migrated["wood-cedar-02"]?.resourceId).toBe("wood-cedar-02");
  });

  it("keeps collection ids language-neutral and migrates old display-name ids", () => {
    expect(COLLECTION_ENTRIES.every((entry) => /^[a-z0-9-]+$/.test(entry.id))).toBe(true);
    expect(migrateCollectionIds(["berry-あかい実", "berry-red"])).toEqual([
      "berry-red",
    ]);
    expect(crossedCollectionMilestone(24, 26)).toBe(25);
    expect(crossedCollectionMilestone(50, 74)).toBeNull();
    expect(crossedCollectionMilestone(49, 76)).toBe(75);
  });
});
describe("Phase 2.2 continuation progression", () => {
  it("turns matching island actions into a once-only daily reward", () => {
    const initial = createInitialState();
    const ignored = applyJourneyEvent(initial.journeyGoal, {
      type: "gather",
      item: "stone",
      amount: 4,
    });
    expect(ignored.goal.amount).toBe(0);
    expect(ignored.reward).toBe(0);
    const complete = applyJourneyEvent(ignored.goal, {
      type: "gather",
      item: "wood",
      amount: 2,
    });
    expect(complete.goal.complete).toBe(true);
    expect(complete.reward).toBe(10);
    expect(
      applyJourneyEvent(complete.goal, {
        type: "gather",
        item: "wood",
        amount: 9,
      }).reward,
    ).toBe(0);
  });
  it("requires earned lumen for useful, priced choices", () => {
    const initial = createInitialState();
    expect(spendLumen(initial, "recipe").ok).toBe(false);

    let state = { ...initial, lumen: 60 };
    const recipe = spendLumen(state, "recipe");
    expect(recipe.ok).toBe(true);
    expect(recipe.state.lumen).toBe(42);
    expect(recipe.state.unlockedRecipes).toContain("cedar-bench");

    state = spendLumen(recipe.state, "grove").state;
    expect(state.lumen).toBe(30);
    expect(state.groveRepairs).toBe(1);

    state = spendLumen(state, "hint").state;
    expect(state.lumen).toBe(24);
    expect(state.collectionHintsBought).toBe(1);
  });
  it("unlocks a visible collection reward at 25 percent", () => {
    const initial = createInitialState();
    const counts = Object.fromEntries(
      COLLECTION_ENTRIES.slice(0, 4).map((entry) => [entry.id, 1]),
    );
    const reward = applyCollectionMilestoneRewards(
      { ...initial, collectionCounts: counts },
      0,
      31,
    );
    expect(reward.milestone).toBe(25);
    expect(reward.state.collectionMilestones).toContain(25);
    expect(reward.state.unlockedRecipes).toContain("harbor-sign");
    expect(reward.state.lumen).toBe(16);
  });

  it("raises Nolla friendship through talk, gift, and building", () => {
    const initial = createInitialState();
    const first = befriendResident(initial, "ノラ");
    expect(first.level).toBe(1);
    expect(first.increased).toBe(true);
    expect(befriendResident(first.state, "ノラ").increased).toBe(false);
    const tomorrow = befriendResident(
      { ...first.state, day: first.state.day + 1 },
      "ノラ",
    );
    expect(tomorrow.level).toBe(1);
  });
  it("uses requests, collection, furniture, and friendship for three ranks", () => {
    const initial = createInitialState();
    expect(calculateIslandRank(initial)).toBe(1);
    const advanced = {
      ...initial,
      collectionCounts: Object.fromEntries(
        COLLECTION_ENTRIES.slice(0, 8).map((entry) => [entry.id, 1]),
      ),
      placedFurniture: [
        {
          id: "test-chair",
          type: "twig-stool" as const,
          position: { x: 0, z: 0 },
          rotation: 0,
        },
      ],
      residentFriendship: { ノラ: 1, カイ: 0, セラ: 0 },
    };
    expect(calculateIslandRank(advanced)).toBe(2);
  });
});