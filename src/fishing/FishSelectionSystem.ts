import {
  fishForHabitat,
  type FishDefinition,
} from "@/src/fishing/FishDefinitions";
import {
  fishIsActive,
  type FishingContext,
} from "@/src/fishing/FishSpawnSystem";
import type { FishHabitat } from "@/src/world/FishingSpotController";

function hashToUnitInterval(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function weightedChoice(
  choices: readonly FishDefinition[],
  roll: number,
): FishDefinition {
  const total = choices.reduce((sum, fish) => sum + fish.baseWeight, 0);
  let cursor = Math.max(0, Math.min(0.999999, roll)) * total;
  for (const fish of choices) {
    cursor -= fish.baseWeight;
    if (cursor < 0) return fish;
  }
  return choices[choices.length - 1];
}

export function selectFish(
  context: FishingContext,
  habitat: FishHabitat,
): FishDefinition {
  const habitatFish = fishForHabitat(habitat);
  const active = habitatFish.filter((fish) =>
    fishIsActive(fish, context.timeOfDay),
  );
  const available = active.length ? active : habitatFish;
  const unseen = available.filter(
    (fish) => !context.discoveredFishIds.includes(fish.id),
  );

  // Every third catch is a discovery catch. It preserves probability for
  // ordinary catches while guaranteeing that a child cannot be stuck forever.
  const discoveryCatch =
    unseen.length > 0 &&
    (context.catchCountAtSpot < available.length ||
      context.catchCountAtSpot % 3 === 2);
  const pool = discoveryCatch ? unseen : available;
  const roll = hashToUnitInterval(
    [
      context.fishingSpotId,
      context.gameDay,
      context.timeOfDay,
      context.catchCountAtSpot,
      context.discoveredFishIds.slice().sort().join(","),
    ].join("|"),
  );
  return weightedChoice(pool, roll);
}
