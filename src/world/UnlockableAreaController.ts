import type { ResourceDefinition } from "@/src/resources/ResourceDefinitions";
import type { WorldCollider } from "@/src/world/CollisionWorld";

export interface WorldProgressionSnapshot {
  islandRank: number;
  groveRepairs: number;
  collectionMilestones: readonly number[];
  bridgeRepaired: boolean;
  nollaFriendship: number;
}

export const INITIAL_WORLD_PROGRESSION: WorldProgressionSnapshot = {
  islandRank: 1,
  groveRepairs: 0,
  collectionMilestones: [],
  bridgeRepaired: false,
  nollaFriendship: 0,
};

export function resourceIsUnlocked(
  definition: ResourceDefinition,
  progression: WorldProgressionSnapshot,
): boolean {
  switch (definition.unlockRequirement) {
    case "bridge":
      return progression.bridgeRepaired;
    case "collection-50":
      return progression.collectionMilestones.includes(50);
    case "collection-75":
      return progression.collectionMilestones.includes(75);
    case "grove-1":
      return progression.groveRepairs >= 1;
    case "grove-2":
      return progression.groveRepairs >= 2;
    case "grove-3":
      return progression.groveRepairs >= 3;
    default:
      return true;
  }
}

export function lockedAreaColliders(
  progression: WorldProgressionSnapshot,
): WorldCollider[] {
  if (progression.bridgeRepaired) return [];
  return [
    {
      kind: "ellipse",
      id: "locked-bridge-islet",
      x: 14.25,
      z: -4.15,
      radiusX: 2.35,
      radiusZ: 2.15,
    },
  ];
}