import { RESOURCE_WORLD_DEFINITIONS } from "@/src/resources/ResourceDefinitions";
import type { WorldCollider } from "@/src/world/CollisionWorld";

type ColliderShape =
  | { kind: "circle"; radius: number }
  | {
      kind: "box";
      halfWidth: number;
      halfDepth: number;
      rotation?: number;
    }
  | { kind: "ellipse"; radiusX: number; radiusZ: number };

export type IslandObjectType =
  | "house"
  | "tree"
  | "rock"
  | "pond"
  | "facility";

export interface IslandObjectDefinition {
  id: string;
  type: IslandObjectType;
  position: { x: number; y?: number; z: number };
  rotation: number;
  collider: ColliderShape;
  placementBlocked: boolean;
}

const object = (
  id: string,
  type: IslandObjectType,
  x: number,
  z: number,
  rotation: number,
  collider: ColliderShape,
): IslandObjectDefinition => ({
  id,
  type,
  position: { x, y: 0.42, z },
  rotation,
  collider,
  placementBlocked: true,
});

export const HOUSE_LAYOUT = [
  object("house-mira", "house", 0, 8.7, 0, {
    kind: "box",
    halfWidth: 2.45,
    halfDepth: 2.05,
    rotation: 0,
  }),
  object("house-nolla", "house", -10.5, 5.4, 0.55, {
    kind: "box",
    halfWidth: 2.45,
    halfDepth: 2.05,
    rotation: 0.55,
  }),
  object("house-kai", "house", 10.5, 3.9, -0.55, {
    kind: "box",
    halfWidth: 2.45,
    halfDepth: 2.05,
    rotation: -0.55,
  }),
  object("house-sera", "house", 5.8, -7.8, 2.55, {
    kind: "box",
    halfWidth: 2.45,
    halfDepth: 2.05,
    rotation: 2.55,
  }),
] as const;

export const TREE_LAYOUT = RESOURCE_WORLD_DEFINITIONS
  .filter((entry) => entry.visualType === "cedar-tree")
  .map((entry) =>
    object(entry.id, "tree", entry.position.x, entry.position.z, entry.rotation ?? 0, entry.collider ?? { kind: "circle", radius: 1.05 }),
  );

export const ROCK_LAYOUT = RESOURCE_WORLD_DEFINITIONS
  .filter((entry) => entry.visualType === "moon-rock")
  .map((entry) =>
    object(entry.id, "rock", entry.position.x, entry.position.z, entry.rotation ?? 0, entry.collider ?? { kind: "circle", radius: 0.95 }),
  );

const fishingSpot = RESOURCE_WORLD_DEFINITIONS.find(
  (entry) => entry.visualType === "fishing-spot",
);

export const POND_LAYOUT = object(
  "moon-pond",
  "pond",
  (fishingSpot?.position.x ?? -8) + (fishingSpot?.collider?.offset?.x ?? 0),
  (fishingSpot?.position.z ?? 1.2) + (fishingSpot?.collider?.offset?.z ?? -3.2),
  0,
  fishingSpot?.collider ?? { kind: "ellipse", radiusX: 3.55, radiusZ: 2.55 },
);

export const ISLAND_LAYOUT: IslandObjectDefinition[] = [
  ...HOUSE_LAYOUT,
  ...TREE_LAYOUT,
  ...ROCK_LAYOUT,
  POND_LAYOUT,
];

export function colliderFromIslandObject(
  definition: IslandObjectDefinition,
): WorldCollider {
  return {
    ...definition.collider,
    id: definition.id,
    x: definition.position.x,
    z: definition.position.z,
  } as WorldCollider;
}

