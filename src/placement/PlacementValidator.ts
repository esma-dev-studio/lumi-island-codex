import type {
  FurnitureId,
  PlacedFurniture,
  Position2D,
} from "@/src/game/types";
import {
  ISLAND_WALK_BOUNDS,
  STATIC_WORLD_COLLIDERS,
  isInsideIsland,
  pointOverlapsCollider,
  type WorldCollider,
} from "@/src/world/CollisionWorld";

export interface PlacementCandidate {
  type: FurnitureId;
  position: Position2D;
  rotation: number;
  editingId?: string;
}

export interface PlacementContext {
  placedFurniture: readonly PlacedFurniture[];
  playerPosition: Position2D;
  npcPositions: readonly Position2D[];
  staticColliders?: readonly WorldCollider[];
}

export interface PlacementValidation {
  valid: boolean;
  reason: string;
}

const FOOTPRINTS: Record<
  FurnitureId,
  { halfWidth: number; halfDepth: number }
> = {
  "twig-stool": { halfWidth: 0.7, halfDepth: 0.55 },
  "stone-lantern": { halfWidth: 0.55, halfDepth: 0.55 },
  "garden-box": { halfWidth: 0.95, halfDepth: 0.65 },
  "picnic-table": { halfWidth: 1.55, halfDepth: 0.9 },
  "shell-mobile": { halfWidth: 0.8, halfDepth: 0.65 },
  "firefly-jar": { halfWidth: 0.5, halfDepth: 0.5 },
  "reed-mat": { halfWidth: 0.85, halfDepth: 0.65 },
  "tea-basket": { halfWidth: 0.7, halfDepth: 0.55 },
  "cedar-bench": { halfWidth: 1.3, halfDepth: 0.65 },
  "harbor-sign": { halfWidth: 0.85, halfDepth: 0.55 },
};

export function validateFurniturePlacement(
  candidate: PlacementCandidate,
  context: PlacementContext,
): PlacementValidation {
  const candidateFootprint = rotatedFootprint(
    candidate.type,
    candidate.rotation,
  );
  const candidateRadius = Math.hypot(
    candidateFootprint.halfWidth,
    candidateFootprint.halfDepth,
  );
  if (
    !isInsideIsland(
      candidate.position,
      candidateRadius,
      ISLAND_WALK_BOUNDS,
    )
  ) {
    return invalid("島の中へ置こう");
  }

  const blockers = context.staticColliders ?? STATIC_WORLD_COLLIDERS;
  if (
    blockers.some((collider) =>
      pointOverlapsCollider(candidate.position, candidateRadius, collider),
    )
  ) {
    return invalid("建物・木・岩・水から少しはなそう");
  }

  if (
    Math.hypot(
      candidate.position.x - context.playerPosition.x,
      candidate.position.z - context.playerPosition.z,
    ) < candidateRadius + 0.55
  ) {
    return invalid("自分の立つ場所をあけよう");
  }

  if (
    context.npcPositions.some(
      (npc) =>
        Math.hypot(
          candidate.position.x - npc.x,
          candidate.position.z - npc.z,
        ) <
        candidateRadius + 1.25,
    )
  ) {
    return invalid("住民の通り道をあけよう");
  }

  for (const placed of context.placedFurniture) {
    if (placed.id === candidate.editingId) continue;
    const placedFootprint = rotatedFootprint(placed.type, placed.rotation);
    if (
      Math.abs(candidate.position.x - placed.position.x) <
        candidateFootprint.halfWidth + placedFootprint.halfWidth &&
      Math.abs(candidate.position.z - placed.position.z) <
        candidateFootprint.halfDepth + placedFootprint.halfDepth
    ) {
      return invalid("ほかの家具から少しはなそう");
    }
  }

  return { valid: true, reason: "ここに置けるよ" };
}

export function rotatedFootprint(
  type: FurnitureId,
  rotation: number,
): { halfWidth: number; halfDepth: number } {
  const footprint = FOOTPRINTS[type];
  const quarterTurns = Math.round(rotation / (Math.PI / 2));
  return Math.abs(quarterTurns) % 2 === 1
    ? {
        halfWidth: footprint.halfDepth,
        halfDepth: footprint.halfWidth,
      }
    : footprint;
}

function invalid(reason: string): PlacementValidation {
  return { valid: false, reason };
}
