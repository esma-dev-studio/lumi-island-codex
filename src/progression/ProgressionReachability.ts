import { COLLECTION_ENTRIES } from "@/src/collection/CollectionData";

export type CollectionUnlockRequirement =
  | "start"
  | "bridge"
  | "collection-50"
  | "collection-75";

const REQUIREMENTS: Readonly<Record<string, CollectionUnlockRequirement>> = {
  "starleaf-islet": "bridge",
  "lantern-goby": "collection-50",
  "glass-ray": "collection-50",
  "moonpetal-night": "collection-75",
  "stardew-night": "collection-75",
};

export interface ReachabilityReport {
  total: number;
  thresholds: Record<25 | 50 | 75 | 100, number>;
  beforeNightGarden: number;
  finalReachable: number;
  unreachableIds: string[];
  hasCircularDependency: boolean;
}

export function collectionRequirement(
  id: string,
): CollectionUnlockRequirement {
  return REQUIREMENTS[id] ?? "start";
}

export function collectionThreshold(percent: 25 | 50 | 75 | 100): number {
  return Math.ceil((COLLECTION_ENTRIES.length * percent) / 100);
}

export function analyzeProgressionReachability(): ReachabilityReport {
  const found = new Set(
    COLLECTION_ENTRIES.filter(
      (entry) => collectionRequirement(entry.id) === "start",
    ).map((entry) => entry.id),
  );
  // The bridge is an economy purchase, deliberately independent of collection.
  COLLECTION_ENTRIES.filter(
    (entry) => collectionRequirement(entry.id) === "bridge",
  ).forEach((entry) => found.add(entry.id));

  if (found.size >= collectionThreshold(50)) {
    COLLECTION_ENTRIES.filter(
      (entry) => collectionRequirement(entry.id) === "collection-50",
    ).forEach((entry) => found.add(entry.id));
  }
  const beforeNightGarden = found.size;
  const hasCircularDependency =
    beforeNightGarden < collectionThreshold(75);

  if (!hasCircularDependency) {
    COLLECTION_ENTRIES.filter(
      (entry) => collectionRequirement(entry.id) === "collection-75",
    ).forEach((entry) => found.add(entry.id));
  }

  return {
    total: COLLECTION_ENTRIES.length,
    thresholds: {
      25: collectionThreshold(25),
      50: collectionThreshold(50),
      75: collectionThreshold(75),
      100: collectionThreshold(100),
    },
    beforeNightGarden,
    finalReachable: found.size,
    unreachableIds: COLLECTION_ENTRIES.filter(
      (entry) => !found.has(entry.id),
    ).map((entry) => entry.id),
    hasCircularDependency,
  };
}

export function nextReachableCollectionId(
  counts: Readonly<Record<string, number>>,
  milestones: readonly number[],
  bridgeRepaired: boolean,
): string | null {
  const candidates = COLLECTION_ENTRIES.filter((entry) => {
    if ((counts[entry.id] ?? 0) > 0) return false;
    const requirement = collectionRequirement(entry.id);
    if (requirement === "bridge") return bridgeRepaired;
    if (requirement === "collection-50") return milestones.includes(50);
    if (requirement === "collection-75") return milestones.includes(75);
    return true;
  });
  return candidates[0]?.id ?? null;
}
