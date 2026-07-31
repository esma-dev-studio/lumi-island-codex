import { chooseFish, type FishDefinition } from "@/src/fishing/FishData";
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
  fishRoll = Math.random(),
  habitat: FishHabitat = "pond",
): FishingResult {
  if (state.phase !== "caught") {
    return {
      caught: false,
      message: "おしい！ 魚はまたすぐに来るよ。",
    };
  }
  const fish = chooseFish(fishRoll, habitat);
  return {
    caught: true,
    fish,
    message: `${fish.name}を つった！`,
  };
}

