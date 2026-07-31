import { describe, expect, it } from "vitest";
import {
  CHARACTER_ORDER,
  getCharacterConfig,
  resolveAnimationName,
} from "@/src/characters/CharacterConfig";
import { CharacterAssetLoadError } from "@/src/characters/CharacterAssetLoader";
import {
  judgeTiming,
  timingConfig,
  timingProgress,
} from "@/src/gathering/TimingGatheringGame";
import { discoverForage } from "@/src/gathering/ForagingSystem";
import { easyModeSettings } from "@/src/accessibility/EasyModeSettings";
import {
  createInitialState,
  sanitizeState,
} from "@/src/game/gameState";
import {
  ISLAND_LAYOUT,
  colliderFromIslandObject,
} from "@/src/world/IslandLayout";
import {
  resolveNpcMovement,
  STATIC_WORLD_COLLIDERS,
} from "@/src/world/CollisionWorld";

describe("Phase 2 character assets", () => {
  it("maps every required animation for every configured GLB", () => {
    const required = [
      "idle",
      "walk",
      "run",
      "talk",
      "pickup",
      "interact",
      "happy",
      "surprised",
      "blink",
    ] as const;

    for (const id of CHARACTER_ORDER) {
      const config = getCharacterConfig(id);
      expect(config.modelPath).toMatch(/\.glb$/);
      expect(config.colliderSize.radius).toBeGreaterThan(0);
      for (const animation of required) {
        expect(resolveAnimationName(config, animation)).toBe(animation);
      }
    }
  });

  it("uses an explicit safe error with model context", () => {
    const error = new CharacterAssetLoadError("mira", "/missing.glb");
    expect(error.name).toBe("CharacterAssetLoadError");
    expect(error.message).toContain("mira");
    expect(error.message).toContain("/missing.glb");
  });
});

describe("gathering timing and easy mode", () => {
  it("moves the marker in a reversible loop", () => {
    expect(timingProgress(0, 2)).toBe(0);
    expect(timingProgress(1, 2)).toBe(0.5);
    expect(timingProgress(2, 2)).toBe(1);
    expect(timingProgress(3, 2)).toBe(0.5);
  });

  it("judges broad good and narrow great windows", () => {
    const config = timingConfig("wood", false);
    expect(
      judgeTiming(
        (config.window.greatStart + config.window.greatEnd) / 2,
        config.window,
      ),
    ).toBe("great");
    expect(judgeTiming(0, config.window)).toBe("normal");
  });

  it("makes both timing and fishing more forgiving", () => {
    const normal = timingConfig("stone", false);
    const easy = timingConfig("stone", true);
    expect(easy.window.goodEnd - easy.window.goodStart).toBeGreaterThan(
      normal.window.goodEnd - normal.window.goodStart,
    );
    expect(easyModeSettings(true).fishingBiteSeconds).toBeGreaterThan(
      easyModeSettings(false).fishingBiteSeconds,
    );
  });

});

describe("foraging and fishing discoveries", () => {
  it("varies discoveries by place and day while staying deterministic", () => {
    const first = discoverForage("berry", "bush-1", 1);
    const repeated = discoverForage("berry", "bush-1", 1);
    expect(repeated).toEqual(first);
    const variants = new Set(
      Array.from({ length: 8 }, (_, day) =>
        discoverForage("berry", "bush-1", day).discoveryId,
      ),
    );
    expect(variants.size).toBeGreaterThan(1);
  });


});

describe("world source, NPC collision, pause, and save migration", () => {
  it("creates every static collider from the shared island layout", () => {
    expect(STATIC_WORLD_COLLIDERS).toEqual(
      ISLAND_LAYOUT.map(colliderFromIslandObject),
    );
  });

  it("keeps an NPC outside other actors", () => {
    const resolved = resolveNpcMovement(
      { x: -2, z: 0 },
      { x: 0.2, z: 0 },
      0.5,
      [],
      [{ id: "player", x: 0, z: 0, radius: 0.5 }],
    );
    expect(Math.hypot(resolved.x, resolved.z)).toBeCloseTo(1);
  });

  it("migrates a version 1 save without losing progress", () => {
    const old = {
      ...createInitialState(),
      version: 1,
      lumen: 777,
      inventory: { wood: 9 },
    };
    const migrated = sanitizeState(old);
    expect(migrated.version).toBe(4);
    expect(migrated.lumen).toBe(777);
    expect(migrated.inventory.wood).toBe(9);
    expect(migrated.easyMode).toBe(false);
    expect(migrated.characterModelId).toBe("mira");
  });

  it("recovers from a future or corrupt save", () => {
    expect(sanitizeState({ version: 99, lumen: 999 }).lumen).toBe(8);
    expect(sanitizeState(null).version).toBe(4);
  });
});

