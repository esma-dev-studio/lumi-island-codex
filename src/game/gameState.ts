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

export const SAVE_KEY = "lumi-island-save-v1";

const questProgress = (): Record<QuestId, QuestProgress> => ({
  "first-kindling": { status: "active", amount: 0 },
  "warm-light": { status: "locked", amount: 0 },
  "sea-letter": { status: "locked", amount: 0 },
  "herbal-tea": { status: "locked", amount: 0 },
  "lighthouse-picnic": { status: "locked", amount: 0 },
});

export const createInitialState = (): GameState => ({
  version: 1,
  playerPosition: { x: 0, z: 6 },
  inventory: {},
  lumen: 120,
  dayMinute: 8 * 60,
  day: 1,
  quests: questProgress(),
  placedFurniture: [],
  islandLevel: 1,
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

export function applyEvent(state: GameState, event: GameEvent): GameState {
  const activeId = QUEST_ORDER.find(
    (id) => state.quests[id].status === "active",
  );
  if (!activeId) return state;
  const matches = eventMatchesQuest(activeId, event);
  if (!matches) return state;

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
    if (nextQuest) {
      quests[nextQuest] = { status: "active", amount: 0 };
    }
  }

  return {
    ...state,
    quests,
    lumen: complete ? state.lumen + definition.reward : state.lumen,
    islandLevel: 1 + QUEST_ORDER.filter((id) => quests[id].status === "complete").length,
  };
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
  return { ...state, day: state.day + 1, dayMinute: total % (24 * 60) };
}

export function formatGameTime(dayMinute: number): string {
  const hour = Math.floor(dayMinute / 60) % 24;
  const minute = Math.floor(dayMinute % 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function sanitizeState(value: unknown): GameState {
  const initial = createInitialState();
  if (!value || typeof value !== "object") return initial;
  const candidate = value as Partial<GameState>;
  if (candidate.version !== 1) return initial;
  return {
    ...initial,
    ...candidate,
    playerPosition: {
      ...initial.playerPosition,
      ...(candidate.playerPosition ?? {}),
    },
    inventory: { ...initial.inventory, ...(candidate.inventory ?? {}) },
    quests: { ...initial.quests, ...(candidate.quests ?? {}) },
    placedFurniture: Array.isArray(candidate.placedFurniture)
      ? candidate.placedFurniture
      : [],
  };
}
