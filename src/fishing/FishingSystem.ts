import type { FishDefinition } from "@/src/fishing/FishDefinitions";
import { selectFish } from "@/src/fishing/FishSelectionSystem";
import type { FishingContext } from "@/src/fishing/FishSpawnSystem";
import type { FishHabitat } from "@/src/world/FishingSpotController";

export interface FishingResolutionState {
  phase: string;
  [key: string]: unknown;
}

export interface FishingResult {
  caught: boolean;
  fish?: FishDefinition;
  message: string;
}

export function resolveFishing(
  state: FishingResolutionState,
  context: FishingContext,
  habitat: FishHabitat = "pond",
): FishingResult {
  if (state.phase !== "caught") {
    return {
      caught: false,
      message: "おしい！ 魚がまたすぐに来るよ。",
    };
  }
  const fish = selectFish(context, habitat);
  return {
    caught: true,
    fish,
    message: `${fish.name}を つった！`,
  };
}