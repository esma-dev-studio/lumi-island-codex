import type { ResourceId } from "@/src/game/types";
import type { TimingGrade } from "@/src/gathering/TimingGatheringGame";

export type GatheringActivity = "wood" | "stone";

export interface GatheringReward {
  item: Extract<ResourceId, "wood" | "stone">;
  amount: number;
  bonusItem?: ResourceId;
  message: string;
}

export function gatheringReward(
  activity: GatheringActivity,
  grade: TimingGrade,
  bonusRoll = 1,
): GatheringReward {
  const item = activity;
  const amount = grade === "great" ? 3 : grade === "good" ? 2 : 1;
  const bonusItem =
    activity === "stone" && grade === "great" && bonusRoll < 0.35
      ? "glowcap"
      : undefined;
  const activityName = activity === "wood" ? "木のえだ" : "石";
  return {
    item,
    amount,
    bonusItem,
    message:
      grade === "great"
        ? `ぴったり！ ${activityName}を ${amount}こ見つけた`
        : grade === "good"
          ? `いいね！ ${activityName}を ${amount}こ見つけた`
          : `だいじょうぶ！ ${activityName}を 1こ見つけた`,
  };
}

