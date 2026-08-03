import { describe, expect, it } from "vitest";
import {
  analyzeProgressionReachability,
  collectionThreshold,
} from "@/src/progression/ProgressionReachability";
import { selectFish } from "@/src/fishing/FishSelectionSystem";
import type { FishingContext } from "@/src/fishing/FishSpawnSystem";
import { simulateAllEconomyStyles } from "@/src/economy/EconomySimulation";
import { createInitialState, sanitizeState } from "@/src/game/gameState";
import {
  applyRankAction,
  rankActions,
} from "@/src/progression/UnlockEffects";
import { primaryObjective } from "@/src/progression/ProgressionDirector";
import { spendLumen } from "@/src/economy/EconomySystem";
import { environmentDetailProfile } from "@/src/world/EnvironmentDetailController";

function discoverFishAtSpot(
  fishingSpotId: string,
  habitat: "pond" | "harbor",
  attempts: number,
): string[] {
  const discovered: string[] = [];
  for (let catchCountAtSpot = 0; catchCountAtSpot < attempts; catchCountAtSpot += 1) {
    const context: FishingContext = {
      fishingSpotId,
      gameDay: 2,
      timeOfDay: "evening",
      catchCountAtSpot,
      discoveredFishIds: discovered,
    };
    const fish = selectFish(context, habitat);
    if (!discovered.includes(fish.id)) discovered.push(fish.id);
  }
  return discovered;
}

describe("release candidate progression reachability", () => {
  it("reaches every milestone without using the night-garden rewards to unlock it", () => {
    const report = analyzeProgressionReachability();
    expect(report.thresholds).toEqual({ 25: 5, 50: 9, 75: 14, 100: 18 });
    expect(report.beforeNightGarden).toBeGreaterThanOrEqual(collectionThreshold(75));
    expect(report.finalReachable).toBe(report.total);
    expect(report.unreachableIds).toEqual([]);
    expect(report.hasCircularDependency).toBe(false);
  });

  it("discovers all pond fish from one spot in a finite deterministic sequence", () => {
    const firstRun = discoverFishAtSpot("fish-moon-pond-01", "pond", 6);
    const secondRun = discoverFishAtSpot("fish-moon-pond-01", "pond", 6);
    expect(firstRun).toEqual(secondRun);
    expect(new Set(firstRun).size).toBe(3);
  });

  it("discovers both harbor-exclusive fish from one harbor spot", () => {
    const fish = discoverFishAtSpot("fish-harbor-deck-01", "harbor", 4);
    expect(new Set(fish).size).toBe(2);
    expect(fish).toEqual(expect.arrayContaining(["lantern-goby", "glass-ray"]));
  });
});

describe("release candidate economy and child progression", () => {
  it("keeps all five play styles unblocked with a meaningful first and second purchase", () => {
    const simulations = simulateAllEconomyStyles();
    expect(simulations).toHaveLength(5);
    simulations.forEach((result) => {
      expect(result.blocked).toBe(false);
      expect(result.purchases.length).toBeGreaterThanOrEqual(2);
      expect(result.purchases[0].remainingLumen).toBeGreaterThanOrEqual(0);
      expect(result.purchases[1].minute).toBeLessThanOrEqual(30);
    });
  });

  it("stores purchased collection hints by item id and migrates them", () => {
    const bought = spendLumen(
      { ...createInitialState(), lumen: 30 },
      "hint",
    );
    expect(bought.ok).toBe(true);
    expect(bought.state.unlockedCollectionHintIds).toHaveLength(1);
    const migrated = sanitizeState(bought.state);
    expect(migrated.unlockedCollectionHintIds).toEqual(
      bought.state.unlockedCollectionHintIds,
    );
  });

  it("unlocks real time-selection actions at island ranks two and three", () => {
    const rankTwo = { ...createInitialState(), islandLevel: 2 as const };
    expect(rankActions(rankTwo).map((action) => action.id)).toEqual([
      "start-morning",
      "rest-evening",
    ]);
    expect(
      applyRankAction({ ...rankTwo, dayMinute: 20 * 60 }, "start-morning"),
    ).toMatchObject({ day: 2, dayMinute: 8 * 60 });
    expect(applyRankAction(rankTwo, "rest-evening").dayMinute).toBe(17 * 60);
    const rankThree = { ...rankTwo, islandLevel: 3 as const };
    expect(rankActions(rankThree).map((action) => action.id)).toContain(
      "wait-night",
    );
    expect(applyRankAction(rankThree, "wait-night").dayMinute).toBe(19 * 60);
  });

  it("always chooses exactly one objective in tutorial, request, daily, unlock order", () => {
    const tutorial = createInitialState();
    expect(primaryObjective(tutorial).kind).toBe("tutorial");
    const request = {
      ...tutorial,
      tutorialProgress: { ...tutorial.tutorialProgress, step: 7 },
    };
    expect(primaryObjective(request).kind).toBe("request");
    const unlock = {
      ...request,
      quests: Object.fromEntries(
        Object.entries(request.quests).map(([id, progress]) => [
          id,
          { ...progress, status: "complete" as const },
        ]),
      ) as typeof request.quests,
      dailyGoalsStartDay: null,
    };
    expect(primaryObjective(unlock).kind).toBe("unlock");
  });

  it("starts with no contradictory free furniture", () => {
    expect(createInitialState().inventory).toEqual({});
    expect(createInitialState().placedFurniture).toEqual([]);
  });
});


describe("release candidate performance profiles", () => {
  it("uses a lower-cost equivalent rendering profile on low-end devices", () => {
    const low = environmentDetailProfile({
      hardwareConcurrency: 4,
      deviceMemory: 4,
      devicePixelRatio: 2,
    });
    const high = environmentDetailProfile({
      hardwareConcurrency: 12,
      deviceMemory: 16,
      devicePixelRatio: 2,
    });
    expect(low.level).toBe("low");
    expect(low.shadowMapSize).toBeLessThan(high.shadowMapSize);
    expect(low.particleCount).toBeLessThan(high.particleCount);
    expect(low.hardwareScalingLevel).toBeGreaterThan(high.hardwareScalingLevel);
  });
});