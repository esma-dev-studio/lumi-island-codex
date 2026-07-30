import { describe, expect, it } from "vitest";
import {
  craftItem,
  createInitialState,
  gatherItem,
  inventoryCount,
  placeFurniture,
  sanitizeState,
} from "@/src/game/gameState";

describe("Lumi Island game loop", () => {
  it("starts with one clear active request", () => {
    const state = createInitialState();
    expect(state.quests["first-kindling"].status).toBe("active");
    expect(state.quests["warm-light"].status).toBe("locked");
    expect(state.lumen).toBe(120);
    expect(inventoryCount(state, "twig-stool")).toBe(1);
  });

  it("gathers resources and advances the first request", () => {
    let state = createInitialState();
    state = gatherItem(state, "wood");
    state = gatherItem(state, "wood", 2);

    expect(inventoryCount(state, "wood")).toBe(3);
    expect(state.quests["first-kindling"].status).toBe("complete");
    expect(state.quests["warm-light"].status).toBe("active");
    expect(state.lumen).toBe(200);
  });

  it("crafts only when every ingredient is available", () => {
    const empty = createInitialState();
    expect(craftItem(empty, "stone-lantern").ok).toBe(false);

    const supplied = {
      ...empty,
      inventory: { stone: 2, glowcap: 1 },
    };
    const result = craftItem(supplied, "stone-lantern");

    expect(result.ok).toBe(true);
    expect(inventoryCount(result.state, "stone")).toBe(0);
    expect(inventoryCount(result.state, "glowcap")).toBe(0);
    expect(inventoryCount(result.state, "stone-lantern")).toBe(1);
  });

  it("places crafted furniture and removes it from the bag", () => {
    const state = {
      ...createInitialState(),
      inventory: { "twig-stool": 1 },
    };
    const result = placeFurniture(
      state,
      "twig-stool",
      { x: 2, z: -1 },
      Math.PI / 4,
    );

    expect(result.ok).toBe(true);
    expect(result.state.placedFurniture).toHaveLength(1);
    expect(inventoryCount(result.state, "twig-stool")).toBe(0);
    expect(result.state.placedFurniture[0].rotation).toBeCloseTo(Math.PI / 4);
  });

  it("recovers safely from invalid save data", () => {
    const recovered = sanitizeState({ version: 99, lumen: 99999 });
    expect(recovered.version).toBe(3);
    expect(recovered.lumen).toBe(120);
    expect(recovered.placedFurniture).toEqual([]);
  });
});
