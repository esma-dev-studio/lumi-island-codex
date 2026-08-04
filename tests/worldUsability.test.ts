import { describe, expect, it } from "vitest";
import { getCharacterConfig } from "@/src/characters/CharacterConfig";
import { createInitialState } from "@/src/game/gameState";
import {
  pointOverlapsCollider,
  STATIC_WORLD_COLLIDERS,
} from "@/src/world/CollisionWorld";
import {
  HOUSE_LAYOUT,
  ROCK_LAYOUT,
  TREE_LAYOUT,
} from "@/src/world/IslandLayout";
import { RESIDENT_WORLD_SPAWNS } from "@/src/world/ResidentSpawns";

describe("child-friendly world navigation", () => {
  it("fits colliders to walls, trunks, and rock bodies instead of their visual overhang", () => {
    expect(
      HOUSE_LAYOUT.every(
        (house) =>
          house.collider.kind === "box" &&
          house.collider.halfWidth <= 2.05 &&
          house.collider.halfDepth <= 1.6,
      ),
    ).toBe(true);
    expect(
      TREE_LAYOUT.every(
        (tree) =>
          tree.collider.kind === "circle" && tree.collider.radius <= 0.48,
      ),
    ).toBe(true);
    expect(
      ROCK_LAYOUT.every(
        (rock) =>
          rock.collider.kind === "ellipse" &&
          rock.collider.radiusX <= 0.78 &&
          rock.collider.radiusZ <= 0.62,
      ),
    ).toBe(true);
  });

  it("keeps the visible path from the start to Nolla open for the player", () => {
    const playerRadius = getCharacterConfig("mira").colliderSize.radius;
    for (let x = -6; x <= 0; x += 0.25) {
      const point = { x, z: 6 };
      expect(
        STATIC_WORLD_COLLIDERS.some((collider) =>
          pointOverlapsCollider(point, playerRadius, collider),
        ),
      ).toBe(false);
    }
  });

  it("spawns every resident in open space and keeps Nolla in the opening view", () => {
    for (const spawn of RESIDENT_WORLD_SPAWNS) {
      const radius = getCharacterConfig(spawn.id).colliderSize.radius;
      expect(
        STATIC_WORLD_COLLIDERS.some((collider) =>
          pointOverlapsCollider(spawn.position, radius, collider),
        ),
      ).toBe(false);
    }
    const initial = createInitialState().playerPosition;
    const nolla = RESIDENT_WORLD_SPAWNS.find(
      (spawn) => spawn.resident === "ノラ",
    );
    expect(nolla).toBeDefined();
    expect(
      Math.hypot(
        (nolla?.position.x ?? 99) - initial.x,
        (nolla?.position.z ?? 99) - initial.z,
      ),
    ).toBeLessThanOrEqual(6.5);
  });
});