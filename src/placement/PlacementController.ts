import type { FurnitureId, Position2D } from "@/src/game/types";
import type { PlacementValidation } from "@/src/placement/PlacementValidator";

export interface PlacementMode {
  type: FurnitureId;
  rotation: number;
  editingId?: string;
}

export interface PlacementPreview extends PlacementValidation {
  position: Position2D;
  rotation: number;
}

export function rotatePlacement(rotation: number, direction: -1 | 1): number {
  const fullTurn = Math.PI * 2;
  return (
    (rotation + direction * (Math.PI / 2) + fullTurn) %
    fullTurn
  );
}
