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

export const TREE_LAYOUT = [
  [-13, -4], [-11, -7], [-7, -8.8], [-4, -9.4], [10.8, -5.8],
  [13.2, -2.5], [-14, 1], [14.5, 2], [-7.7, 7.6],
].map(([x, z], index) =>
  object(`tree-${index}`, "tree", x, z, 0, { kind: "circle", radius: 1.05 }),
);

export const ROCK_LAYOUT = [
  [-5.3, 4.5], [8, 7], [11.4, -0.8], [-3, -7.2],
].map(([x, z], index) =>
  object(`rock-${index}`, "rock", x, z, 0, { kind: "circle", radius: 0.95 }),
);

export const POND_LAYOUT = object("moon-pond", "pond", -8, -2, 0, {
  kind: "ellipse",
  radiusX: 3.55,
  radiusZ: 2.55,
});

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

