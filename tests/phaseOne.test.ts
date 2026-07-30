import { describe, expect, it } from "vitest";
import {
  advanceTimeWhileRunning,
  craftItem,
  createInitialState,
  gatherItem,
  inventoryCount,
  moveFurniture,
  placeFurniture,
  removeFurniture,
} from "@/src/game/gameState";
import { cameraRelativeMovement } from "@/src/world/CameraRelativeMovement";
import {
  ISLAND_WALK_BOUNDS,
  resolveWorldMovement,
  type WorldCollider,
} from "@/src/world/CollisionWorld";
import {
  rotatedFootprint,
  validateFurniturePlacement,
} from "@/src/placement/PlacementValidator";
import { rotatePlacement } from "@/src/placement/PlacementController";

describe("camera-relative movement", () => {
  it("moves toward the camera forward direction", () => {
    expect(cameraRelativeMovement(0, 1, { x: 0, z: -2 })).toEqual({
      x: 0,
      z: -1,
    });
  });

  it("keeps screen-right intuitive after the camera rotates", () => {
    const movement = cameraRelativeMovement(1, 0, { x: 1, z: 0 });
    expect(movement.x).toBeCloseTo(0);
    expect(movement.z).toBeCloseTo(-1);
  });

  it("normalizes diagonal input", () => {
    const movement = cameraRelativeMovement(1, 1, { x: 0, z: -1 });
    expect(Math.hypot(movement.x, movement.z)).toBeCloseTo(1);
  });
});

describe("collision world", () => {
  it("pushes the player outside a circle collider", () => {
    const colliders: WorldCollider[] = [
      { kind: "circle", id: "tree", x: 0, z: 0, radius: 1 },
    ];
    const result = resolveWorldMovement(
      { x: -2, z: 0 },
      { x: 0.2, z: 0 },
      0.5,
      colliders,
    );
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(1.5);
  });

  it("blocks entry into a rotated box", () => {
    const colliders: WorldCollider[] = [
      {
        kind: "box",
        id: "house",
        x: 0,
        z: 0,
        halfWidth: 2,
        halfDepth: 1,
        rotation: Math.PI / 4,
      },
    ];
    const result = resolveWorldMovement(
      { x: 3, z: 0 },
      { x: 0, z: 0 },
      0.4,
      colliders,
    );
    expect(Math.hypot(result.x, result.z)).toBeGreaterThan(0.9);
  });

  it("blocks water represented by an ellipse", () => {
    const colliders: WorldCollider[] = [
      {
        kind: "ellipse",
        id: "pond",
        x: -8,
        z: -2,
        radiusX: 3,
        radiusZ: 2,
      },
    ];
    const result = resolveWorldMovement(
      { x: -3, z: -2 },
      { x: -8, z: -2 },
      0.5,
      colliders,
    );
    const normalized =
      ((result.x + 8) * (result.x + 8)) / (3.5 * 3.5) +
      ((result.z + 2) * (result.z + 2)) / (2.5 * 2.5);
    expect(normalized).toBeCloseTo(1);
  });

  it("keeps the player inside the island", () => {
    const result = resolveWorldMovement(
      { x: 0, z: 0 },
      { x: 100, z: 100 },
      0.5,
      [],
    );
    const normalized =
      (result.x * result.x) /
        ((ISLAND_WALK_BOUNDS.radiusX - 0.5) ** 2) +
      (result.z * result.z) /
        ((ISLAND_WALK_BOUNDS.radiusZ - 0.5) ** 2);
    expect(normalized).toBeCloseTo(1);
  });
});

describe("furniture placement", () => {
  const context = {
    placedFurniture: [],
    playerPosition: { x: 0, z: 6 },
    npcPositions: [
      { x: -8.7, z: 4.4 },
      { x: 8.8, z: 3.2 },
      { x: 4.8, z: -5.6 },
    ],
  };

  it("allows a clear island location", () => {
    expect(
      validateFurniturePlacement(
        {
          type: "twig-stool",
          position: { x: 0, z: 0 },
          rotation: 0,
        },
        context,
      ).valid,
    ).toBe(true);
  });

  it("rejects pond and building locations", () => {
    expect(
      validateFurniturePlacement(
        {
          type: "twig-stool",
          position: { x: -8, z: -2 },
          rotation: 0,
        },
        context,
      ).valid,
    ).toBe(false);
    expect(
      validateFurniturePlacement(
        {
          type: "twig-stool",
          position: { x: 0, z: 8.7 },
          rotation: 0,
        },
        context,
      ).valid,
    ).toBe(false);
  });

  it("rejects overlap with another furniture item", () => {
    const result = validateFurniturePlacement(
      {
        type: "twig-stool",
        position: { x: 2.2, z: 0 },
        rotation: 0,
      },
      {
        ...context,
        placedFurniture: [
          {
            id: "existing",
            type: "picnic-table",
            position: { x: 2, z: 0 },
            rotation: 0,
          },
        ],
      },
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("家具");
  });

  it("rotates rectangular footprints by 90 degrees", () => {
    const normal = rotatedFootprint("picnic-table", 0);
    const rotated = rotatedFootprint("picnic-table", Math.PI / 2);
    expect(rotated.halfWidth).toBe(normal.halfDepth);
    expect(rotatePlacement(0, 1)).toBeCloseTo(Math.PI / 2);
  });

  it("moves and removes furniture without losing it", () => {
    const initial = {
      ...createInitialState(),
      inventory: { "twig-stool": 1 },
    };
    const placed = placeFurniture(
      initial,
      "twig-stool",
      { x: 1, z: 0 },
      0,
    );
    const id = placed.state.placedFurniture[0].id;
    const moved = moveFurniture(
      placed.state,
      id,
      { x: 2, z: 1 },
      Math.PI / 2,
    );
    expect(moved.ok).toBe(true);
    expect(moved.state.placedFurniture[0].position).toEqual({ x: 2, z: 1 });

    const removed = removeFurniture(moved.state, id);
    expect(removed.ok).toBe(true);
    expect(removed.state.placedFurniture).toHaveLength(0);
    expect(inventoryCount(removed.state, "twig-stool")).toBe(1);
  });
});

describe("pause and request regression", () => {
  it("does not advance time while paused", () => {
    const state = createInitialState();
    expect(advanceTimeWhileRunning(state, 30, true)).toBe(state);
    expect(advanceTimeWhileRunning(state, 30, false).dayMinute).toBe(
      state.dayMinute + 30,
    );
  });

  it("keeps all five requests progressing in order", () => {
    let state = gatherItem(createInitialState(), "wood", 3);
    state = craftItem(
      { ...state, inventory: { ...state.inventory, stone: 2, glowcap: 1 } },
      "stone-lantern",
    ).state;
    state = gatherItem(state, "shell", 3);
    state = craftItem(
      { ...state, inventory: { ...state.inventory, berry: 2, herb: 2 } },
      "tea-basket",
    ).state;
    state = placeFurniture(
      {
        ...state,
        inventory: { ...state.inventory, "picnic-table": 1 },
      },
      "picnic-table",
      { x: 0, z: 0 },
      0,
    ).state;

    expect(Object.values(state.quests).every((quest) => quest.status === "complete")).toBe(true);
    expect(state.islandLevel).toBe(6);
  });
});
