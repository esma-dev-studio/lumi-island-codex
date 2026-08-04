import type { CharacterId } from "@/src/characters/CharacterConfig";
import type { ResidentId } from "@/src/game/types";

export interface ResidentWorldSpawn {
  id: Exclude<CharacterId, "mira">;
  resident: ResidentId;
  position: { x: number; y: number; z: number };
  facing: number;
  wanderRadius: number;
}

export const RESIDENT_WORLD_SPAWNS: readonly ResidentWorldSpawn[] = [
  {
    id: "nolla",
    resident: "ノラ",
    position: { x: -3.6, y: 0.44, z: 5.8 },
    facing: -0.65,
    wanderRadius: 0.62,
  },
  {
    id: "kai",
    resident: "カイ",
    position: { x: 7.3, y: 0.44, z: 2.4 },
    facing: 0,
    wanderRadius: 0.8,
  },
  {
    id: "sera",
    resident: "セラ",
    position: { x: 7.3, y: 0.44, z: -4.7 },
    facing: 0.7,
    wanderRadius: 0.92,
  },
] as const;