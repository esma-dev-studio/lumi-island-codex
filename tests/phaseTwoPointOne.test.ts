import { describe, expect, it } from "vitest";
import {
  createTutorialProgress,
  applyTutorialEvent,
} from "@/src/tutorial/TutorialSystem";
import {
  availableResourceState,
  depleteResource,
  isResourceAvailable,
  sanitizeResourceStates,
  tickResourceStates,
} from "@/src/resources/ResourceStateSystem";
import {
  createWoodGathering,
  recordWoodHit,
  woodReward,
} from "@/src/gathering/WoodGatheringGame";
import {
  chooseRockCrack,
  createRockCracks,
} from "@/src/gathering/RockGatheringGame";
import {
  advanceFishingJourney,
  castFishingLine,
  createFishingJourney,
  pullFishingLine,
} from "@/src/fishing/FishingJourneyGame";
import {
  collectionCategoryCompletion,
  collectionCompletion,
  migrateCollectionCounts,
  registerActivityDiscovery,
} from "@/src/collection/CollectionSystem";
import {
  activityDuration,
  animationForActivity,
} from "@/src/activities/ActivityCoordinator";
import { sanitizeState } from "@/src/game/gameState";

describe("Phase 2.1 event tutorial", () => {
  it("does not advance the walk step until cumulative movement reaches 3m", () => {
    let progress = createTutorialProgress();
    progress = applyTutorialEvent(progress, { type: "move", distance: 1.2 });
    expect(progress.step).toBe(0);
    progress = applyTutorialEvent(progress, { type: "move", distance: 1.7 });
    expect(progress.step).toBe(0);
    progress = applyTutorialEvent(progress, { type: "move", distance: 0.2 });
    expect(progress.step).toBe(1);
    expect(progress.walkedDistance).toBeCloseTo(3.1);
  });

  it("ignores an event that does not match the current step", () => {
    const progress = createTutorialProgress();
    expect(applyTutorialEvent(progress, { type: "craft", item: "twig-stool" })).toBe(progress);
  });
});

describe("Phase 2.1 resource lifecycle", () => {
  it("depletes, visibly recovers, and becomes available on schedule", () => {
    const depleted = depleteResource({}, "tree-1", "wood", 10);
    expect(isResourceAvailable(depleted, "tree-1")).toBe(false);
    expect(depleted["tree-1"].visualStage).toBe(1);

    const recovering = tickResourceStates(depleted, 120);
    expect(recovering["tree-1"].state).toBe("recovering");
    expect(recovering["tree-1"].visualStage).toBe(2);

    const restored = tickResourceStates(recovering, 190);
    expect(restored["tree-1"]).toEqual(availableResourceState("tree-1"));
    expect(isResourceAvailable(restored, "tree-1")).toBe(true);
  });

  it("migrates the disconnected Phase 2 resource shape safely", () => {
    const migrated = sanitizeResourceStates({
      "tree-old": { availableAt: 200, visualVariant: 1 },
    });
    expect(migrated["tree-old"]).toEqual(availableResourceState("tree-old"));
  });
});

describe("distinct gathering decisions", () => {
  it("requires three wood hits and rewards rhythm quality", () => {
    let game = createWoodGathering();
    game = recordWoodHit(game, "great");
    game = recordWoodHit(game, "great");
    expect(game.hits).toHaveLength(2);
    game = recordWoodHit(game, "great");
    expect(woodReward(game)).toEqual({ amount: 3, grade: "excellent" });
  });

  it("makes rock selection deterministic per source and never gives zero", () => {
    const cracks = createRockCracks("rock-4");
    const strongest = cracks.reduce((best, crack) =>
      crack.strength > best.strength ? crack : best,
    );
    expect(chooseRockCrack(cracks, strongest.id)).toEqual({
      correct: true,
      amount: 2,
      grade: "excellent",
    });
    expect(chooseRockCrack(cracks, (strongest.id + 1) % 3).amount).toBe(1);
  });

  it("includes aim, fake nibble, bite, and easy one-step reeling", () => {
    let fishing = createFishingJourney(true, 0);
    fishing = castFishingLine(fishing, fishing.shadow);
    fishing = advanceFishingJourney(fishing, fishing.biteAt - 0.5);
    expect(fishing.phase).toBe("nibble");
    fishing = advanceFishingJourney(fishing, 0.6);
    expect(fishing.phase).toBe("bite");
    fishing = pullFishingLine(fishing);
    expect(fishing.phase).toBe("reeling");
    fishing = pullFishingLine(fishing);
    expect(fishing.phase).toBe("caught");
  });
});

describe("collection, animation ordering, and save migration", () => {
  it("registers discoveries automatically and calculates category progress", () => {
    const counts = registerActivityDiscovery(
      {},
      {
        activityType: "fishing",
        sourceId: "fish-1",
        grade: "good",
        rewardItems: [{ itemId: "fish", quantity: 1 }],
        fishId: "lumi-minnow",
        message: "つれた",
      },
    );
    expect(counts["lumi-minnow"]).toBe(1);
    expect(collectionCompletion(counts)).toMatchObject({ found: 1, total: 18 });
    expect(collectionCategoryCompletion(counts, "fish")).toEqual({
      found: 1,
      total: 5,
      percent: 20,
    });
  });

  it("restores old discovery arrays into collection counts", () => {
    expect(
      migrateCollectionCounts(undefined, ["shell-しましま貝"], ["moon-carp"]),
    ).toEqual({ "shell-striped": 1, "moon-carp": 1 });
  });

  it("maps activity results to real character actions before settlement", () => {
    expect(animationForActivity("wood")).toBe("chop");
    expect(animationForActivity("rock")).toBe("mine");
    expect(animationForActivity("fishing")).toBe("fish");
    expect(
      activityDuration({
        activityType: "fishing",
        sourceId: "fish-1",
        grade: "good",
        rewardItems: [{ itemId: "fish", quantity: 1 }],
        message: "つれた",
      }),
    ).toBeGreaterThan(1);
  });

  it("migrates Phase 2 saves without losing progress", () => {
    const migrated = sanitizeState({
      version: 2,
      lumen: 432,
      tutorialStep: 5,
      discoveredItems: ["berry-あかい実"],
      caughtFish: ["lumi-minnow"],
      resourceStates: {
        "tree-1": {
          resourceId: "tree-1",
          state: "depleted",
          depletedAt: 4,
          recoverAt: 184,
          visualStage: 1,
        },
      },
    });
    expect(migrated.version).toBe(4);
    expect(migrated.lumen).toBe(432);
    expect(migrated.tutorialProgress.step).toBe(5);
    expect(migrated.collectionCounts["lumi-minnow"]).toBe(1);
    expect(migrated.resourceStates["wood-cedar-02"].state).toBe("depleted");
  });
});
