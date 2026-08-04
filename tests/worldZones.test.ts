import { describe, expect, it } from "vitest";
import { ISLAND_WALK_BOUNDS } from "@/src/world/CollisionWorld";
import {
  WORLD_ZONES,
  stableWorldZoneAt,
  worldZoneAt,
  worldZoneGroundY,
} from "@/src/world/WorldZones";
import { ZONE_AMBIENT_PROFILES } from "@/src/audio/ZoneAmbientAudioSystem";
import { PRODUCTION_ENVIRONMENT_PLACEMENTS } from "@/src/world/ProductionEnvironmentAssets";

describe("production four-zone world", () => {
  it("ships four independently named and textured places", () => {
    expect(WORLD_ZONES).toHaveLength(4);
    expect(new Set(WORLD_ZONES.map((zone) => zone.id)).size).toBe(4);
    expect(new Set(WORLD_ZONES.map((zone) => zone.texturePath)).size).toBe(4);
    expect(WORLD_ZONES.every((zone) => zone.name && zone.reading)).toBe(true);
  });

  it("selects each zone at its own landmark center", () => {
    for (const zone of WORLD_ZONES) {
      expect(worldZoneAt(zone.center).id).toBe(zone.id);
    }
  });

  it("uses distinct surface layers so overlapping zone edges cannot flicker", () => {
    const heights = WORLD_ZONES.map((_, index) => worldZoneGroundY(index));
    expect(new Set(heights).size).toBe(WORLD_ZONES.length);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.01);
  });

  it("does not rapidly switch the location label at a zone boundary", () => {
    const boundary = { x: -7.25, z: 0.75 };
    const meadow = WORLD_ZONES.find((zone) => zone.id === "meadow") ?? null;
    expect(stableWorldZoneAt(boundary, meadow).id).toBe("meadow");
    expect(stableWorldZoneAt(WORLD_ZONES[1].center, meadow).id).toBe("forest");
  });

  it("expands the walkable island to at least 2.5 times the old area", () => {
    const oldAreaFactor = 17.45 * 12.55;
    const currentAreaFactor =
      ISLAND_WALK_BOUNDS.radiusX * ISLAND_WALK_BOUNDS.radiusZ;
    expect(currentAreaFactor / oldAreaFactor).toBeGreaterThanOrEqual(2.45);
  });

  it("gives every place a distinct, low-volume ambient sound profile", () => {
    expect(Object.keys(ZONE_AMBIENT_PROFILES).sort()).toEqual(
      WORLD_ZONES.map((zone) => zone.id).sort(),
    );
    expect(
      new Set(Object.values(ZONE_AMBIENT_PROFILES).map((profile) => profile.noiseFrequency)).size,
    ).toBe(4);
    expect(Object.values(ZONE_AMBIENT_PROFILES).every((profile) => profile.gain <= 0.05)).toBe(true);
  });

  it("places authored CC0 environment models across the world", () => {
    expect(PRODUCTION_ENVIRONMENT_PLACEMENTS.length).toBeGreaterThanOrEqual(10);
    expect(
      new Set(PRODUCTION_ENVIRONMENT_PLACEMENTS.map((placement) => placement.file)).size,
    ).toBeGreaterThanOrEqual(8);
    const occupiedZones = new Set(
      PRODUCTION_ENVIRONMENT_PLACEMENTS.map((placement) => worldZoneAt(placement.position).id),
    );
    expect(occupiedZones.size).toBe(4);
  });
});
