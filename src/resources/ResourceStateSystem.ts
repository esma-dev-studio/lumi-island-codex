import {
  recoverySecondsFor,
  stableResourceId,
} from "@/src/resources/ResourceDefinitions";
import type { ResourceId, ResourceState } from "@/src/game/types";

export function availableResourceState(resourceId: string): ResourceState {
  return {
    resourceId,
    state: "available",
    visualStage: 0,
  };
}

export function depleteResource(
  states: Record<string, ResourceState>,
  resourceId: string,
  item: ResourceId,
  playSeconds: number,
): Record<string, ResourceState> {
  const recoverySeconds = recoverySecondsFor(item);
  return {
    ...states,
    [resourceId]: {
      resourceId,
      state: "depleted",
      depletedAt: playSeconds,
      recoverAt: playSeconds + recoverySeconds,
      visualStage: 1,
    },
  };
}

export function tickResourceStates(
  states: Record<string, ResourceState>,
  playSeconds: number,
): Record<string, ResourceState> {
  let changed = false;
  const next = Object.fromEntries(
    Object.entries(states).map(([id, resource]) => {
      if (!resource.recoverAt || resource.state === "available") {
        return [id, resource];
      }
      if (playSeconds >= resource.recoverAt) {
        changed = true;
        return [id, availableResourceState(id)];
      }
      const depletedAt = resource.depletedAt ?? playSeconds;
      const halfway = depletedAt + (resource.recoverAt - depletedAt) * 0.55;
      if (playSeconds >= halfway && resource.state !== "recovering") {
        changed = true;
        return [
          id,
          {
            ...resource,
            state: "recovering" as const,
            visualStage: 2,
          },
        ];
      }
      return [id, resource];
    }),
  );
  return changed ? next : states;
}

export function isResourceAvailable(
  states: Record<string, ResourceState>,
  resourceId: string,
): boolean {
  return (states[resourceId]?.state ?? "available") === "available";
}

export function sanitizeResourceStates(
  value: unknown,
): Record<string, ResourceState> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, ResourceState> = {};
  for (const [storedId, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object") continue;
    const resourceId = stableResourceId(storedId);
    if (result[resourceId] && storedId !== resourceId) continue;
    const candidate = raw as Partial<ResourceState> & {
      availableAt?: number;
      visualVariant?: number;
    };
    if (
      candidate.state === "available" ||
      candidate.state === "depleted" ||
      candidate.state === "recovering"
    ) {
      result[resourceId] = {
        resourceId,
        state: candidate.state,
        depletedAt:
          typeof candidate.depletedAt === "number"
            ? candidate.depletedAt
            : undefined,
        recoverAt:
          typeof candidate.recoverAt === "number"
            ? candidate.recoverAt
            : undefined,
        visualStage:
          typeof candidate.visualStage === "number"
            ? candidate.visualStage
            : candidate.state === "available"
              ? 0
              : 1,
      };
      continue;
    }
    // Phase 2 stored an availableAt field but never connected it to the scene.
    // Migrate safely to available so an old save cannot strand the player.
    result[resourceId] = availableResourceState(resourceId);
  }
  return result;
}
