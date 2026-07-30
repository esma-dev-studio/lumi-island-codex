import type {
  ActivityResult,
  ActivityType,
} from "@/src/activities/ActivityResult";

export type PlayerActionState =
  | { type: "free" }
  | {
      type: "activity";
      activity: ActivityType;
      sourceId: string;
      phase: "prepare" | "animate" | "reward";
    };

export const FREE_PLAYER_ACTION: PlayerActionState = { type: "free" };

export function preparePlayerActivity(
  activity: ActivityType,
  sourceId: string,
): PlayerActionState {
  return { type: "activity", activity, sourceId, phase: "prepare" };
}

export function animatePlayerActivity(
  result: ActivityResult,
): PlayerActionState {
  return {
    type: "activity",
    activity: result.activityType,
    sourceId: result.sourceId,
    phase: "animate",
  };
}

export function rewardPlayerActivity(
  action: PlayerActionState,
): PlayerActionState {
  return action.type === "activity"
    ? { ...action, phase: "reward" }
    : action;
}

export function isPlayerMovementLocked(action: PlayerActionState): boolean {
  return action.type === "activity";
}
