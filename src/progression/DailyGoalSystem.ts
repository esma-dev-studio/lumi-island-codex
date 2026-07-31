import { DAILY_GOAL_REWARD } from "@/src/economy/EconomyConfig";
import type {
  GameEvent,
  JourneyGoalState,
  ResourceId,
  ResidentId,
} from "@/src/game/types";

interface DailyGoalTemplate {
  kind: JourneyGoalState["kind"];
  target: number;
  label: string;
  item?: ResourceId;
  resident?: ResidentId;
}

const DAILY_GOALS: DailyGoalTemplate[] = [
  { kind: "gather", item: "wood", target: 2, label: "木のえだを 2こ 集めよう" },
  { kind: "talk", resident: "ノラ", target: 1, label: "ノラと 話そう" },
  { kind: "place", target: 1, label: "家具を 1こ 置こう" },
  { kind: "gather", item: "fish", target: 1, label: "魚を 1ぴき つろう" },
];

export function createJourneyGoal(day: number): JourneyGoalState {
  const template = DAILY_GOALS[(Math.max(1, day) - 1) % DAILY_GOALS.length];
  return {
    day,
    kind: template.kind,
    item: template.item,
    resident: template.resident,
    label: template.label,
    amount: 0,
    target: template.target,
    reward: DAILY_GOAL_REWARD,
    complete: false,
  };
}

export function journeyGoalLabel(goal: JourneyGoalState): string {
  return goal.label;
}

function matchesGoal(goal: JourneyGoalState, event: GameEvent): boolean {
  if (goal.kind !== event.type) return false;
  if (event.type === "gather") return !goal.item || goal.item === event.item;
  if (event.type === "talk") return !goal.resident || goal.resident === event.resident;
  return true;
}

export function applyJourneyEvent(
  goal: JourneyGoalState,
  event: GameEvent,
): { goal: JourneyGoalState; reward: number } {
  if (goal.complete || !matchesGoal(goal, event)) return { goal, reward: 0 };
  const increment = event.type === "gather" ? event.amount : 1;
  const amount = Math.min(goal.target, goal.amount + increment);
  const complete = amount >= goal.target;
  return {
    goal: { ...goal, amount, complete },
    reward: complete ? goal.reward : 0,
  };
}

export function dailyGoalIsActive(startDay: number | null, day: number): boolean {
  return startDay !== null && day >= startDay;
}