import type { ResourceId } from "@/src/game/types";

export type ActivityType = "wood" | "rock" | "forage" | "fishing";
export type ActivityGrade = "normal" | "good" | "excellent";

export interface ActivityRewardItem {
  itemId: ResourceId;
  quantity: number;
}

export interface ActivityResult {
  activityType: ActivityType;
  sourceId: string;
  grade: ActivityGrade;
  rewardItems: ActivityRewardItem[];
  discoveryId?: string;
  fishId?: string;
  message: string;
}
