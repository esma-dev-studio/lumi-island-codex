import type { AnimationName } from "@/src/game/types";
import type {
  ActivityResult,
  ActivityType,
} from "@/src/activities/ActivityResult";

export function animationForActivity(
  activity: ActivityType,
): AnimationName {
  if (activity === "wood") return "chop";
  if (activity === "rock") return "mine";
  if (activity === "fishing") return "fish";
  return "pickup";
}

export function activityDuration(result: ActivityResult): number {
  if (result.activityType === "fishing") return 1.05;
  if (result.activityType === "wood" || result.activityType === "rock") {
    return 0.78;
  }
  return 0.62;
}
