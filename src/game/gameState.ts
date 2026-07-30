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
  migrateCollectionCounts,
  migrateCollectionIds,
} from "@/src/collection/CollectionSystem";
import { createTutorialProgress } from "@/src/tutorial/TutorialSystem";
import {
  applyJourneyEvent,
  BASE_RECIPES,
  createJourneyGoal,
  withCalculatedRank,
} from "@/src/progression/ProgressionSystem";

export const SAVE_KEY = "lumi-island-save-v1";

const questProgress = (): Record<QuestId, QuestProgress> => ({
  "first-kindling": { status: "active", amount: 0 },
  "warm-light": { status: "locked", amount: 0 },
  "sea-letter": { status: "locked", amount: 0 },
  "herbal-tea": { status: "locked", amount: 0 },
  "lighthouse-picnic": { status: "locked", amount: 0 },
});

export const createInitialState = (): GameState => ({
  version: 3,
  playerPosition: { x: 0, z: 6 },
  easyMode: false,
  tutorialStep: 0,
  tutorialProgress: createTutorialProgress(),
  discoveredItems: [],
  caughtFish: [],
  collectionCounts: {},
  resourceStates: {},
  audioSettings: { muted: false, effectsVolume: 0.72 },
  characterModelId: "mira",
  playSeconds: 0,
  inventory: { "twig-stool": 1 },
  lumen: 120,
  dayMinute: 8 * 60,
  day: 1,
  quests: questProgress(),
  placedFurniture: [],
  islandLevel: 1,
  unlockedRecipes: [...BASE_RECIPES],
  collectionMilestones: [],
  groveRepairs: 0,
  collectionHintsBought: 0,
  residentFriendship: { ノラ: 0, カイ: 0, セラ: 0 },
  residentLastTalkDay: {},
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
  const journey = applyJourneyEvent(state.journeyGoal, event);
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

  if (complete) {
    const currentIndex = QUEST_ORDER.indexOf(activeId);
    const nextQuest = QUEST_ORDER[currentIndex + 1];
    if (nextQuest) quests[nextQuest] = { status: "active", amount: 0 };
  }

  const resident = definition.resident;
  const residentFriendship = complete
    ? {
        ...state.residentFriendship,
        [resident]: Math.min(3, (state.residentFriendship[resident] ?? 0) + 1),
      }
    : state.residentFriendship;
  next = {
    ...next,
    quests,
    residentFriendship,
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
    candidate.version !== 3
  ) {
    return initial;
  }
  const migrated =
    candidate.version === 1
      ? {
          ...candidate,
          version: 3 as const,
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
          version: 3 as const,
          tutorialProgress:
            candidate.tutorialProgress ??
            createTutorialProgress(candidate.tutorialStep ?? 7),
          audioSettings: candidate.audioSettings ?? initial.audioSettings,
        };
  return withCalculatedRank({
    ...initial,
    ...migrated,
    version: 3,
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
    collectionCounts: migrateCollectionCounts(
      migrated.collectionCounts,
      Array.isArray(migrated.discoveredItems)
        ? migrated.discoveredItems
        : [],
      Array.isArray(migrated.caughtFish)
        ? migrated.caughtFish
        : [],
    ),
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
    collectionMilestones: Array.isArray(migrated.collectionMilestones)
      ? migrated.collectionMilestones.filter(
          (value): value is number => value === 25 || value === 50 || value === 75,
        )
      : [],
    groveRepairs:
      typeof migrated.groveRepairs === "number"
        ? Math.max(0, Math.min(3, Math.floor(migrated.groveRepairs)))
        : 0,
    collectionHintsBought:
      typeof migrated.collectionHintsBought === "number"
        ? Math.max(0, Math.floor(migrated.collectionHintsBought))
        : 0,
    residentFriendship: {
      ...initial.residentFriendship,
      ...(migrated.residentFriendship ?? {}),
    },
    residentLastTalkDay: migrated.residentLastTalkDay ?? {},
    journeyGoal:
      migrated.journeyGoal && migrated.journeyGoal.day === (migrated.day ?? initial.day)
        ? migrated.journeyGoal
        : createJourneyGoal(migrated.day ?? initial.day),
  });
}
