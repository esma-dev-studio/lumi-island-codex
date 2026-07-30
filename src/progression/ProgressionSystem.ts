import { COLLECTION_ENTRIES } from "@/src/collection/CollectionData";
import { collectionCompletion } from "@/src/collection/CollectionSystem";
import { QUEST_ORDER } from "@/src/data/gameData";
import type {
  FurnitureId,
  GameEvent,
  GameState,
  IslandRank,
  JourneyGoalKind,
  JourneyGoalState,
  ResidentId,
} from "@/src/game/types";

export const BASE_RECIPES: FurnitureId[] = [
  "twig-stool",
  "stone-lantern",
  "garden-box",
  "picnic-table",
  "shell-mobile",
  "firefly-jar",
  "reed-mat",
  "tea-basket",
];

export const LUMEN_USES = {
  recipe: { cost: 20, item: "cedar-bench" as const },
  grove: { cost: 15, max: 3 },
  hint: { cost: 10 },
};

const JOURNEY_GOALS: Array<{
  kind: JourneyGoalKind;
  target: number;
  reward: number;
  label: string;
}> = [
  { kind: "gather", target: 5, reward: 45, label: "島のものを 5こ あつめる" },
  { kind: "craft", target: 1, reward: 60, label: "家具を 1こ つくる" },
  { kind: "place", target: 1, reward: 70, label: "家具を 1こ おく" },
];

export function createJourneyGoal(day: number): JourneyGoalState {
  const template = JOURNEY_GOALS[(Math.max(1, day) - 1) % JOURNEY_GOALS.length];
  return {
    day,
    kind: template.kind,
    amount: 0,
    target: template.target,
    reward: template.reward,
    complete: false,
  };
}

export function journeyGoalLabel(goal: JourneyGoalState): string {
  return (
    JOURNEY_GOALS.find((candidate) => candidate.kind === goal.kind)?.label ??
    "島で ひとつ おてつだいする"
  );
}

export function applyJourneyEvent(
  goal: JourneyGoalState,
  event: GameEvent,
): { goal: JourneyGoalState; reward: number } {
  if (goal.complete || event.type !== goal.kind) return { goal, reward: 0 };
  const increment = event.type === "gather" ? event.amount : 1;
  const amount = Math.min(goal.target, goal.amount + increment);
  const complete = amount >= goal.target;
  return {
    goal: { ...goal, amount, complete },
    reward: complete ? goal.reward : 0,
  };
}

export function calculateIslandRank(state: GameState): IslandRank {
  const completedQuests = QUEST_ORDER.filter(
    (id) => state.quests[id].status === "complete",
  ).length;
  const collectionFound = collectionCompletion(state.collectionCounts).found;
  const friendship = Object.values(state.residentFriendship).reduce(
    (sum, value) => sum + value,
    0,
  );
  const progressScore =
    completedQuests +
    Math.floor(collectionFound / 4) +
    Math.min(2, state.placedFurniture.length) +
    friendship;
  if (progressScore >= 10) return 3;
  if (progressScore >= 4) return 2;
  return 1;
}

export function withCalculatedRank(state: GameState): GameState {
  return { ...state, islandLevel: calculateIslandRank(state) };
}

export function applyCollectionMilestoneRewards(
  state: GameState,
  beforePercent: number,
  afterPercent: number,
): { state: GameState; milestone: 25 | 50 | 75 | null; rewardLabel?: string } {
  const milestone = ([75, 50, 25] as const).find(
    (value) =>
      beforePercent < value &&
      afterPercent >= value &&
      !state.collectionMilestones.includes(value),
  );
  if (!milestone) return { state: withCalculatedRank(state), milestone: null };

  const unlockedRecipes =
    milestone === 25 && !state.unlockedRecipes.includes("harbor-sign")
      ? [...state.unlockedRecipes, "harbor-sign" as const]
      : state.unlockedRecipes;
  const rewardLabel =
    milestone === 25
      ? "「港のしるべ」の作り方を おぼえた！"
      : milestone === 50
        ? "月の池に 新しい釣り場が ひらいた！"
        : "夜にひかる 花の庭が ひらいた！";
  const next = {
    ...state,
    lumen: state.lumen + milestone,
    unlockedRecipes,
    collectionMilestones: [...state.collectionMilestones, milestone],
  };
  return { state: withCalculatedRank(next), milestone, rewardLabel };
}

export function spendLumen(
  state: GameState,
  use: "recipe" | "grove" | "hint",
): { state: GameState; ok: boolean; message: string } {
  const cost = LUMEN_USES[use].cost;
  if (state.lumen < cost) {
    return { state, ok: false, message: "ルーメンが たりないよ" };
  }
  if (use === "recipe") {
    if (state.unlockedRecipes.includes(LUMEN_USES.recipe.item)) {
      return { state, ok: false, message: "この作り方は もうおぼえているよ" };
    }
    return {
      state: {
        ...state,
        lumen: state.lumen - cost,
        unlockedRecipes: [...state.unlockedRecipes, LUMEN_USES.recipe.item],
      },
      ok: true,
      message: "「杉のベンチ」の作り方を おぼえた！",
    };
  }
  if (use === "grove") {
    if (state.groveRepairs >= LUMEN_USES.grove.max) {
      return { state, ok: false, message: "木もれ日の森は すっかり元気！" };
    }
    const next = {
      ...state,
      lumen: state.lumen - cost,
      groveRepairs: state.groveRepairs + 1,
    };
    return {
      state: withCalculatedRank(next),
      ok: true,
      message: `木もれ日の森を ${next.groveRepairs}/3 なおした！`,
    };
  }
  const remaining = COLLECTION_ENTRIES.filter(
    (entry) => (state.collectionCounts[entry.id] ?? 0) === 0,
  );
  if (!remaining.length) {
    return { state, ok: false, message: "ずかんは ぜんぶ見つけたよ！" };
  }
  const entry = remaining[state.collectionHintsBought % remaining.length];
  return {
    state: {
      ...state,
      lumen: state.lumen - cost,
      collectionHintsBought: state.collectionHintsBought + 1,
    },
    ok: true,
    message: `${entry.name}は「${entry.place}」に いるかも！`,
  };
}

export function befriendResident(
  state: GameState,
  resident: ResidentId,
): { state: GameState; increased: boolean; level: number } {
  const current = state.residentFriendship[resident] ?? 0;
  if (state.residentLastTalkDay[resident] === state.day || current >= 3) {
    return { state, increased: false, level: current };
  }
  const level = current + 1;
  const next = {
    ...state,
    residentFriendship: { ...state.residentFriendship, [resident]: level },
    residentLastTalkDay: { ...state.residentLastTalkDay, [resident]: state.day },
  };
  return { state: withCalculatedRank(next), increased: true, level };
}