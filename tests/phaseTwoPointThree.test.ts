import { describe, expect, it } from "vitest";
import {
  advanceTime,
  applyEvent,
  createInitialState,
  gatherItem,
  sanitizeState,
} from "@/src/game/gameState";
import { spendLumen } from "@/src/economy/EconomySystem";
import { ECONOMY_PRICES, INITIAL_LUMEN } from "@/src/economy/EconomyConfig";
import {
  applyNollaFurnitureBond,
  befriendResident,
  giveNollaWood,
} from "@/src/progression/FriendshipSystem";
import {
  applyCollectionMilestoneRewards,
  dailyGoalIsActive,
} from "@/src/progression/ProgressionSystem";
import {
  INITIAL_WORLD_PROGRESSION,
  lockedAreaColliders,
  resourceIsUnlocked,
} from "@/src/world/UnlockableAreaController";
import {
  RESOURCE_WORLD_DEFINITIONS,
  resourceDefinitionById,
} from "@/src/resources/ResourceDefinitions";
import {
  isNightMinute,
  resourceIsAvailableAtTime,
} from "@/src/world/NightGardenController";
import { chooseFish, fishForHabitat } from "@/src/fishing/FishData";
import {
  fishHabitatForSource,
  fishingSpotLabel,
} from "@/src/world/FishingSpotController";
import { TouchMovementController } from "@/src/input/TouchMovementController";
import { COLLECTION_ENTRIES } from "@/src/collection/CollectionData";

function finishInitialRequests() {
  let state = applyEvent(createInitialState(), { type: "gather", item: "wood", amount: 3 });
  state = applyEvent(state, { type: "craft", item: "stone-lantern" });
  state = applyEvent(state, { type: "gather", item: "shell", amount: 3 });
  state = applyEvent(state, { type: "craft", item: "tea-basket" });
  return applyEvent(state, { type: "place", item: "picnic-table" });
}

describe("Phase 2.3 economy and unlock play", () => {
  it("starts lean with no free furniture and a reachable first reward", () => {
    const state = createInitialState();
    expect(state.lumen).toBe(INITIAL_LUMEN);
    expect(state.inventory).toEqual({});
    expect(spendLumen(state, "recipe").ok).toBe(false);
    const rewarded = gatherItem(state, "wood", 3);
    expect(rewarded.lumen).toBe(INITIAL_LUMEN + 12);
    expect(spendLumen(rewarded, "hint").ok).toBe(true);
    expect(spendLumen(rewarded, "recipe").ok).toBe(false);
  });

  it("repairs the bridge and changes both collision and exploration resources", () => {
    const locked = lockedAreaColliders(INITIAL_WORLD_PROGRESSION);
    expect(locked.map((collider) => collider.id)).toContain("locked-bridge-islet");
    const purchased = spendLumen({ ...createInitialState(), lumen: 40 }, "bridge");
    expect(purchased.ok).toBe(true);
    expect(purchased.state.lumen).toBe(8);
    const progression = { ...INITIAL_WORLD_PROGRESSION, bridgeRepaired: true };
    expect(lockedAreaColliders(progression)).toEqual([]);
    const starleaf = resourceDefinitionById("starleaf-bridge-islet-01");
    expect(starleaf && resourceIsUnlocked(starleaf, progression)).toBe(true);
  });

  it("prices three forest recovery stages and reveals one resource per stage", () => {
    let state = { ...createInitialState(), lumen: 100 };
    const costs: number[] = [];
    for (let stage = 0; stage < 3; stage += 1) {
      costs.push(ECONOMY_PRICES.grove[stage]);
      state = spendLumen(state, "grove").state;
      const requirement = `grove-${stage + 1}`;
      const definition = RESOURCE_WORLD_DEFINITIONS.find(
        (entry) => entry.unlockRequirement === requirement,
      );
      expect(definition && resourceIsUnlocked(definition, {
        ...INITIAL_WORLD_PROGRESSION,
        groveRepairs: state.groveRepairs,
      })).toBe(true);
    }
    expect(costs).toEqual([18, 26, 34]);
    expect(state.groveRepairs).toBe(3);
  });

  it("turns collection milestones into harbor and night-garden play", () => {
    const at50 = applyCollectionMilestoneRewards(createInitialState(), 49, 50).state;
    const harbor = resourceDefinitionById("fish-harbor-deck-01");
    expect(at50.collectionMilestones).toContain(50);
    expect(harbor && resourceIsUnlocked(harbor, {
      ...INITIAL_WORLD_PROGRESSION,
      collectionMilestones: at50.collectionMilestones,
    })).toBe(true);

    const at75 = applyCollectionMilestoneRewards(at50, 74, 75).state;
    const flower = resourceDefinitionById("moonpetal-night-garden-01");
    expect(at75.collectionMilestones).toContain(75);
    expect(flower && resourceIsUnlocked(flower, {
      ...INITIAL_WORLD_PROGRESSION,
      collectionMilestones: at75.collectionMilestones,
    })).toBe(true);
    expect(flower && resourceIsAvailableAtTime(flower, 12 * 60)).toBe(false);
    expect(flower && resourceIsAvailableAtTime(flower, 20 * 60)).toBe(true);
    expect(isNightMinute(4 * 60)).toBe(true);
  });

  it("gives the harbor a distinct label and fish pool", () => {
    expect(fishHabitatForSource("fish-harbor-deck-01")).toBe("harbor");
    expect(fishingSpotLabel("fish-harbor-deck-01")).toContain("海辺");
    expect(fishForHabitat("harbor")).toHaveLength(2);
    expect(chooseFish(0, "harbor").habitat).toBe("harbor");
    expect(chooseFish(0, "pond").habitat).toBe("pond");
  });
});

describe("Phase 2.3 child progression and input", () => {
  it("keeps daily work hidden until the five first requests are finished", () => {
    const initial = createInitialState();
    expect(dailyGoalIsActive(initial.dailyGoalsStartDay, initial.day)).toBe(false);
    const finished = finishInitialRequests();
    expect(finished.dailyGoalsStartDay).toBe(2);
    expect(dailyGoalIsActive(finished.dailyGoalsStartDay, finished.day)).toBe(false);
    const tomorrow = advanceTime(finished, 16 * 60);
    expect(tomorrow.day).toBe(2);
    expect(tomorrow.journeyGoal.kind).toBe("talk");
    const done = applyEvent(tomorrow, { type: "talk", resident: "ノラ" });
    expect(done.journeyGoal.complete).toBe(true);
    expect(done.lumen).toBe(tomorrow.lumen + 10);
  });

  it("makes Nolla friendship a talk, gift, and nearby-building story", () => {
    const talked = befriendResident(createInitialState(), "ノラ");
    expect(talked.level).toBe(1);
    const ready = {
      ...talked.state,
      inventory: { ...talked.state.inventory, wood: 1 },
      quests: {
        ...talked.state.quests,
        "first-kindling": { status: "complete" as const, amount: 3 },
      },
    };
    const gifted = giveNollaWood(ready);
    expect(gifted.level).toBe(2);
    expect(gifted.state.inventory.wood).toBe(0);
    expect(gifted.state.unlockedRecipes).toContain("nolla-workbench");
    const built = applyNollaFurnitureBond(
      gifted.state,
      "nolla-workbench",
      { x: -8.7, z: 4.4 },
    );
    expect(built.level).toBe(3);
    expect(built.state.nollaMemorySeen).toBe(false);
  });

  it("does not grant Nolla level three when the workshop is far away", () => {
    const state = {
      ...createInitialState(),
      residentFriendship: { ノラ: 2, カイ: 0, セラ: 0 },
    };
    expect(
      applyNollaFurnitureBond(state, "nolla-workbench", { x: 8, z: 8 }).increased,
    ).toBe(false);
  });

  it("emits exactly one key-down and one key-up per touch press", () => {
    const events: Array<[string, boolean]> = [];
    const controller = new TouchMovementController((key, down) => events.push([key, down]));
    controller.press("ArrowUp");
    controller.press("ArrowUp");
    controller.release("ArrowUp");
    controller.release("ArrowUp");
    expect(events).toEqual([
      ["ArrowUp", true],
      ["ArrowUp", false],
    ]);
  });

  it("releases every held direction when a panel pauses play", () => {
    const events: Array<[string, boolean]> = [];
    const controller = new TouchMovementController((key, down) => events.push([key, down]));
    controller.press("ArrowLeft");
    controller.press("ArrowDown");
    controller.releaseAll();
    expect(events.filter(([, down]) => !down)).toHaveLength(2);
    expect(controller.isPressed("ArrowLeft")).toBe(false);
  });

  it("migrates older saves into the new progression fields", () => {
    const migrated = sanitizeState({ version: 3, lumen: 77, inventory: { wood: 2 } });
    expect(migrated.version).toBe(5);
    expect(migrated.lumen).toBe(77);
    expect(migrated.bridgeRepaired).toBe(false);
    expect(migrated.dailyGoalsStartDay).toBeNull();
    expect(migrated.inventory.wood).toBe(2);
  });

  it("keeps every new discovery id stable and unique", () => {
    const ids = COLLECTION_ENTRIES.map((entry) => entry.id);
    expect(ids).toHaveLength(18);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([
      "lantern-goby",
      "glass-ray",
      "starleaf-islet",
      "moonpetal-night",
      "stardew-night",
    ]));
  });
});
