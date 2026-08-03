import type { FishDefinition } from "@/src/fishing/FishDefinitions";

export type FishingTimeOfDay = "day" | "evening" | "night";

export interface FishingContext {
  fishingSpotId: string;
  gameDay: number;
  timeOfDay: FishingTimeOfDay;
  catchCountAtSpot: number;
  discoveredFishIds: readonly string[];
}

export function fishingTimeOfDay(dayMinute: number): FishingTimeOfDay {
  const minute = ((dayMinute % 1440) + 1440) % 1440;
  if (minute >= 19 * 60 || minute < 5 * 60) return "night";
  if (minute >= 16 * 60) return "evening";
  return "day";
}

export function fishIsActive(
  fish: FishDefinition,
  timeOfDay: FishingTimeOfDay,
): boolean {
  return (
    fish.activeTimes.includes("any") || fish.activeTimes.includes(timeOfDay)
  );
}
