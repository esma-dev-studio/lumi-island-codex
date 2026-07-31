import { resourceDefinitionById } from "@/src/resources/ResourceDefinitions";

export type FishHabitat = "pond" | "harbor";

export function fishHabitatForSource(sourceId: string): FishHabitat {
  return resourceDefinitionById(sourceId)?.fishHabitat ?? "pond";
}

export function fishingSpotLabel(sourceId: string): string {
  return fishHabitatForSource(sourceId) === "harbor"
    ? "海辺の釣りデッキ"
    : "月の池";
}