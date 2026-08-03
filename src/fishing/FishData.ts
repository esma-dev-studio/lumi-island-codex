export {
  FISH_DEFINITIONS as FISH,
  fishForHabitat,
  type FishDefinition,
} from "@/src/fishing/FishDefinitions";

import {
  fishForHabitat,
  type FishDefinition,
} from "@/src/fishing/FishDefinitions";
import type { FishHabitat } from "@/src/world/FishingSpotController";

/** Compatibility helper for older tests and callers. */
export function chooseFish(
  seed: number,
  habitat: FishHabitat = "pond",
): FishDefinition {
  const choices = fishForHabitat(habitat);
  const normalized = Math.max(0, Math.min(0.999999, seed));
  return choices[Math.floor(normalized * choices.length)];
}