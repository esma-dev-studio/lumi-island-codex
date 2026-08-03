import { QUEST_ORDER, QUESTS, RECIPES } from "@/src/data/gameData";
import type {
  FurnitureId,
  GameEvent,
  GameState,
  ItemId,
  PlacedFurniture,
  QuestId,
  QuestProgress,
  ResourceId,
} from "@/src/game/types";
import { sanitizeResourceStates } from "@/src/resources/ResourceStateSystem";
import {
  collectionCompletion,
  migrateCollectionCounts,
  migrateCollectionIds,
} from "@/src/collection/CollectionSystem";
import { createTutorialProgress } from "@/src/tutorial/TutorialSystem";
import {
  applyJourneyEvent,
  createJourneyGoal,
  dailyGoalIsActive,
} from "@/src/progression/DailyGoalSystem";
import { BASE_RECIPES } from "@/src/progression/UnlockCatalog";
import { withCalculatedRank } from "@/src/progression/IslandRankSystem";
import { INITIAL_LUMEN } from "@/src/economy/EconomyConfig";

export const SAVE_KEY = "lumi-island-save-v1";

const questProgress = (): Record<QuestId, QuestProgress> => ({
  "first-kindling": { status: "active", amount: 0 },
  "warm-light": { status: "locked", amount: 0 },
  "sea-letter": { status: "locked", amount: 0 },
  "herbal-tea": { status: "locked", amount: 0 },
  "lighthouse-picnic": { status: "locked", amount: 0 },
});

export const createInitialState = (): GameState => ({
  version: 5,
  playerPosition: { x: 0, z: 6 },
  easyMode: true,
  tutorialStep: 0,
  tutorialProgress: createTutorialProgress(),
  discoveredItems: [],
  caughtFish: [],
  fishingCatchCounts: {},
  collectionCounts: {},
  collectionFirstSeenDay: {},
  resourceStates: {},
  audioSettings: { muted: false, effectsVolume: 0.72 },
  characterModelId: "mira",
  playSeconds: 0,
  inventory: {},
  lumen: INITIAL_LUMEN,
  dayMinute: 8 * 60,
  day: 1,
  quests: questProgress(),
  placedFurniture: [],
  islandLevel: 1,
  unlockedRecipes: [...BASE_RECIPES],
  collectionMilestones: [],
  groveRepairs: 0,
  groveQuestComplete: false,
  bridgeRepaired: false,
  unlockedCollectionHintIds: [],
  residentFriendship: { ノラ: 0, カイ: 0, セラ: 0 },
  residentLastTalkDay: {},
  nollaMemorySeen: false,
  dailyGoalsStartDay: null,
  journeyGoal: createJourneyGoal(1),
  totalGathered: 0,
  totalCrafted: 0,
  lastSavedAt: Date.now(),
});

export function inventoryCount(state: GameState, item: ItemId): number {
  return state.inventory[item] ?? 0;
}

export function gatherItem(
  state: GameState,
  item: ResourceId,
  amount = 1,
): GameState {
  const next = {
    ...state,
    inventory: {
      ...state.inventory,
      [item]: inventoryCount(state, item) + amount,
    },
    totalGathered: state.totalGathered + amount,
  };
  return applyEvent(next, { type: "gather", item, amount });
}

export function canCraft(state: GameState, furniture: FurnitureId): boolean {
  const recipe = RECIPES.find((candidate) => candidate.id === furniture);
  if (!recipe) return false;
  return Object.entries(recipe.cost).every(
    ([item, count]) => inventoryCount(state, item as ResourceId) >= (count ?? 0),
  );
}

export function craftItem(
  state: GameState,
  furniture: FurnitureId,
): { state: GameState; ok: boolean } {
  const recipe = RECIPES.find((candidate) => candidate.id === furniture);
  if (!recipe || !canCraft(state, furniture)) return { state, ok: false };

  const inventory = { ...state.inventory };
  for (const [item, count] of Object.entries(recipe.cost)) {
    inventory[item as ResourceId] =
      (inventory[item as ResourceId] ?? 0) - (count ?? 0);
  }
  inventory[furniture] = (inventory[furniture] ?? 0) + 1;

  const next = applyEvent(
    { ...state, inventory, totalCrafted: state.totalCrafted + 1 },
    { type: "craft", item: furniture },
  );
  return { state: next, ok: true };
}

export function placeFurniture(
  state: GameState,
  type: FurnitureId,
  position: { x: number; z: number },
  rotation: number,
): { state: GameState; ok: boolean; placed?: PlacedFurniture } {
  if (inventoryCount(state, type) < 1) return { state, ok: false };
  const placed: PlacedFurniture = {
    id: `${type}-${Date.now()}-${state.placedFurniture.length}`,
    type,
    position,
    rotation,
  };
  const next = applyEvent(
    {
      ...state,
      inventory: {
        ...state.inventory,
        [type]: inventoryCount(state, type) - 1,
      },
      placedFurniture: [...state.placedFurniture, placed],
    },
    { type: "place", item: type },
  );
  return { state: next, ok: true, placed };
}

export function moveFurniture(
  state: GameState,
  id: string,
  position: { x: number; z: number },
  rotation: number,
): { state: GameState; ok: boolean } {
  const target = state.placedFurniture.find((item) => item.id === id);
  if (!target) return { state, ok: false };
  return {
    state: {
      ...state,
      placedFurniture: state.placedFurniture.map((item) =>
        item.id === id ? { ...item, position, rotation } : item,
      ),
    },
    ok: true,
  };
}

export function removeFurniture(
  state: GameState,
  id: string,
): { state: GameState; ok: boolean; item?: FurnitureId } {
  const target = state.placedFurniture.find((item) => item.id === id);
  if (!target) return { state, ok: false };
  return {
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        [target.type]: inventoryCount(state, target.type) + 1,
      },
      placedFurniture: state.placedFurniture.filter((item) => item.id !== id),
    },
    ok: true,
    item: target.type,
  };
}

export function advanceTimeWhileRunning(
  state: GameState,
  minutes: number,
  paused: boolean,
): GameState {
  return paused ? state : advanceTime(state, minutes);
}

export function applyEvent(state: GameState, event: GameEvent): GameState {
  const dailyActive = dailyGoalIsActive(state.dailyGoalsStartDay, state.day);
  const journey = dailyActive
    ? applyJourneyEvent(state.journeyGoal, event)
    : { goal: state.journeyGoal, reward: 0 };
  let next: GameState = {
    ...state,
    journeyGoal: journey.goal,
    lumen: state.lumen + journey.reward,
  };
  const activeId = QUEST_ORDER.find(
    (id) => state.quests[id].status === "active",
  );
  if (!activeId || !eventMatchesQuest(activeId, event)) {
    return withCalculatedRank(next);
  }

  const definition = QUESTS[activeId];
  const amount =
    event.type === "gather"
      ? Math.min(definition.target, state.quests[activeId].amount + event.amount)
      : definition.target;
  const complete = amount >= definition.target;
  const quests = {
    ...state.quests,
    [activeId]: {
      status: complete ? ("complete" as const) : ("active" as const),
      amount,
    },
  };
  let dailyGoalsStartDay = state.dailyGoalsStartDay;

  if (complete) {
    const currentIndex = QUEST_ORDER.indexOf(activeId);
    const nextQuest = QUEST_ORDER[currentIndex + 1];
    if (nextQuest) {
      quests[nextQuest] = { status: "active", amount: 0 };
    } else if (dailyGoalsStartDay === null) {
      dailyGoalsStartDay = state.day + 1;
    }
  }

  next = {
    ...next,
    quests,
    dailyGoalsStartDay,
    lumen: complete ? next.lumen + definition.reward : next.lumen,
  };
  return withCalculatedRank(next);
}
function eventMatchesQuest(quest: QuestId, event: GameEvent): boolean {
  if (quest === "first-kindling") {
    return event.type === "gather" && event.item === "wood";
  }
  if (quest === "warm-light") {
    return event.type === "craft" && event.item === "stone-lantern";
  }
  if (quest === "sea-letter") {
    return event.type === "gather" && event.item === "shell";
  }
  if (quest === "herbal-tea") {
    return event.type === "craft" && event.item === "tea-basket";
  }
  return event.type === "place" && event.item === "picnic-table";
}

export function advanceTime(state: GameState, minutes: number): GameState {
  const total = state.dayMinute + minutes;
  if (total < 24 * 60) return { ...state, dayMinute: total };
  const day = state.day + 1;
  return {
    ...state,
    day,
    dayMinute: total % (24 * 60),
    journeyGoal: createJourneyGoal(day),
  };
}

export function formatGameTime(dayMinute: number): string {
  const hour = Math.floor(dayMinute / 60) % 24;
  const minute = Math.floor(dayMinute % 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function sanitizeState(value: unknown): GameState {
  const initial = createInitialState();
  if (!value || typeof value !== "object") return initial;
  const candidate = value as Partial<Omit<GameState, "version">> & { version?: number };
  if (
    candidate.version !== 1 &&
    candidate.version !== 2 &&
    candidate.version !== 3 &&
    candidate.version !== 4 &&
    candidate.version !== 5
  ) {
    return initial;
  }
  const migrated =
    candidate.version === 1
      ? {
          ...candidate,
          version: 5 as const,
          easyMode: false,
          tutorialStep: 7,
          tutorialProgress: createTutorialProgress(7),
          discoveredItems: [],
          caughtFish: [],
          collectionCounts: {},
          resourceStates: {},
          audioSettings: initial.audioSettings,
          characterModelId: "mira" as const,
          playSeconds: 0,
        }
      : {
          ...candidate,
          version: 5 as const,
          tutorialProgress:
            candidate.tutorialProgress ??
            createTutorialProgress(candidate.tutorialStep ?? 7),
          audioSettings: candidate.audioSettings ?? initial.audioSettings,
        };
  const collectionCounts = migrateCollectionCounts(
    migrated.collectionCounts,
    Array.isArray(migrated.discoveredItems) ? migrated.discoveredItems : [],
    Array.isArray(migrated.caughtFish) ? migrated.caughtFish : [],
  );
  const completion = collectionCompletion(collectionCounts);
  const savedMilestones = Array.isArray(migrated.collectionMilestones)
    ? migrated.collectionMilestones.filter(
        (value): value is 25 | 50 | 75 =>
          value === 25 || value === 50 || value === 75,
      )
    : [];
  const impliedMilestones = ([25, 50, 75] as const).filter(
    (milestone) => completion.percent >= milestone,
  );
  const collectionMilestones = [
    ...new Set<25 | 50 | 75>([...savedMilestones, ...impliedMilestones]),
  ].sort((left, right) => left - right);

  return withCalculatedRank({
    ...initial,
    ...migrated,
    version: 5,
    playerPosition: {
      ...initial.playerPosition,
      ...(migrated.playerPosition ?? {}),
    },
    inventory: { ...initial.inventory, ...(migrated.inventory ?? {}) },
    quests: { ...initial.quests, ...(migrated.quests ?? {}) },
    tutorialStep: migrated.tutorialProgress?.step ?? migrated.tutorialStep ?? 7,
    tutorialProgress:
      migrated.tutorialProgress ??
      createTutorialProgress(migrated.tutorialStep ?? 7),
    discoveredItems: migrateCollectionIds(migrated.discoveredItems),
    caughtFish: migrateCollectionIds(migrated.caughtFish),
    fishingCatchCounts:
      migrated.fishingCatchCounts && typeof migrated.fishingCatchCounts === 'object'
        ? Object.fromEntries(
            Object.entries(migrated.fishingCatchCounts)
              .filter(([, count]) => typeof count === 'number' && count > 0)
              .map(([sourceId, count]) => [sourceId, Math.floor(count as number)]),
          )
        : {},
    collectionCounts,
    collectionFirstSeenDay:
      migrated.collectionFirstSeenDay && typeof migrated.collectionFirstSeenDay === 'object'
        ? Object.fromEntries(
            Object.entries(migrated.collectionFirstSeenDay)
              .filter(([, day]) => typeof day === 'number' && day > 0)
              .map(([id, day]) => [id, Math.floor(day as number)]),
          )
        : {},
    resourceStates: sanitizeResourceStates(migrated.resourceStates),
    audioSettings: {
      muted: Boolean(migrated.audioSettings?.muted),
      effectsVolume:
        typeof migrated.audioSettings?.effectsVolume === "number"
          ? Math.max(0, Math.min(1, migrated.audioSettings.effectsVolume))
          : initial.audioSettings.effectsVolume,
    },
    placedFurniture: Array.isArray(migrated.placedFurniture)
      ? migrated.placedFurniture
      : [],
    unlockedRecipes: Array.isArray(migrated.unlockedRecipes)
      ? migrated.unlockedRecipes
      : [...BASE_RECIPES],
    collectionMilestones,
    groveRepairs:
      typeof migrated.groveRepairs === "number"
        ? Math.max(0, Math.min(3, Math.floor(migrated.groveRepairs)))
        : 0,
    groveQuestComplete: Boolean(migrated.groveQuestComplete),
    bridgeRepaired: Boolean(migrated.bridgeRepaired),
    unlockedCollectionHintIds: Array.isArray(migrated.unlockedCollectionHintIds)
      ? migrateCollectionIds(migrated.unlockedCollectionHintIds)
      : [],
    residentFriendship: {
      ...initial.residentFriendship,
      ...(migrated.residentFriendship ?? {}),
    },
    residentLastTalkDay: migrated.residentLastTalkDay ?? {},
    nollaMemorySeen: Boolean(migrated.nollaMemorySeen),
    dailyGoalsStartDay:
      typeof migrated.dailyGoalsStartDay === "number"
        ? Math.max(1, Math.floor(migrated.dailyGoalsStartDay))
        : QUEST_ORDER.every((id) => migrated.quests?.[id]?.status === "complete")
          ? (migrated.day ?? initial.day) + 1
          : null,
    journeyGoal: (() => {
      const day = migrated.day ?? initial.day;
      const fresh = createJourneyGoal(day);
      if (!migrated.journeyGoal || migrated.journeyGoal.day !== day) return fresh;
      const amount = Math.max(
        0,
        Math.min(fresh.target, Number(migrated.journeyGoal.amount) || 0),
      );
      return { ...fresh, amount, complete: amount >= fresh.target };
    })(),
  });
}
