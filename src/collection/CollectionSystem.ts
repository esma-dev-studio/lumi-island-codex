import {
  COLLECTION_ENTRIES,
  type CollectionCategory,
} from "@/src/collection/CollectionData";
import type { ActivityResult } from "@/src/activities/ActivityResult";

export function registerActivityDiscovery(
  counts: Record<string, number>,
  result: ActivityResult,
): Record<string, number> {
  const id = result.fishId ?? result.discoveryId;
  if (!id) return counts;
  return { ...counts, [id]: (counts[id] ?? 0) + 1 };
}

export function collectionCompletion(
  counts: Record<string, number>,
): { found: number; total: number; percent: number } {
  const found = COLLECTION_ENTRIES.filter(
    (entry) => (counts[entry.id] ?? 0) > 0,
  ).length;
  const total = COLLECTION_ENTRIES.length;
  return {
    found,
    total,
    percent: total ? Math.round((found / total) * 100) : 0,
  };
}

export function migrateCollectionCounts(
  value: unknown,
  discoveredItems: string[],
  caughtFish: string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([id, amount]) => {
      if (typeof amount === "number" && amount > 0) {
        counts[id] = Math.floor(amount);
      }
    });
  }
  [...discoveredItems, ...caughtFish].forEach((id) => {
    counts[id] = Math.max(1, counts[id] ?? 0);

  });
  return counts;
}

export function collectionCategoryCompletion(
  counts: Record<string, number>,
  category: CollectionCategory | "all",
): { found: number; total: number; percent: number } {
  const entries =
    category === "all"
      ? COLLECTION_ENTRIES
      : COLLECTION_ENTRIES.filter((entry) => entry.category === category);
  const found = entries.filter((entry) => (counts[entry.id] ?? 0) > 0).length;
  const total = entries.length;
  return {
    found,
    total,
    percent: total ? Math.round((found / total) * 100) : 0,
  };
}
