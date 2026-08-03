export type ResourceId =
  | "wood"
  | "stone"
  | "berry"
  | "herb"
  | "shell"
  | "glowcap"
  | "reed"
  | "starleaf"
  | "moonpetal"
  | "stardew"
  | "fish";

export type FurnitureId =
  | "twig-stool"
  | "stone-lantern"
  | "garden-box"
  | "picnic-table"
  | "shell-mobile"
  | "firefly-jar"
  | "reed-mat"
  | "tea-basket"
  | "cedar-bench"
  | "harbor-sign"
  | "nolla-workbench";

export type ItemId = ResourceId | FurnitureId;
export type ResidentId = "ノラ" | "カイ" | "セラ";
export type QuestId =
  | "first-kindling"
  | "warm-light"
  | "sea-letter"
  | "herbal-tea"
  | "lighthouse-picnic";

export type QuestStatus = "locked" | "active" | "complete";
export type AnimationName =
  | "idle"
  | "walk"
  | "run"
  | "talk"
  | "interact"
  | "pickup"
  | "happy"
  | "surprised"
  | "blink"
  | "chop"
  | "mine"
  | "fish"
  | "wave";

export interface ResourceState {
  resourceId: string;
  state: "available" | "depleted" | "recovering";
  depletedAt?: number;
  recoverAt?: number;
  visualStage: number;
}

export interface TutorialProgressState {
  step: number;
  walkedDistance: number;
}

export interface AudioSettings {
  muted: boolean;
  effectsVolume: number;
}

export interface Position2D {
  x: number;
  z: number;
}

export interface PlacedFurniture {
  id: string;
  type: FurnitureId;
  position: Position2D;
  rotation: number;
}

export interface QuestProgress {
  status: QuestStatus;
  amount: number;
}

export type IslandRank = 1 | 2 | 3;
export type JourneyGoalKind = "gather" | "craft" | "place" | "talk";

export interface JourneyGoalState {
  day: number;
  kind: JourneyGoalKind;
  item?: ResourceId;
  resident?: ResidentId;
  label: string;
  amount: number;
  target: number;
  reward: number;
  complete: boolean;
}

export interface GameState {
  version: 5;
  playerPosition: Position2D;
  easyMode: boolean;
  tutorialStep: number;
  tutorialProgress: TutorialProgressState;
  discoveredItems: string[];
  caughtFish: string[];
  fishingCatchCounts: Record<string, number>;
  collectionCounts: Record<string, number>;
  collectionFirstSeenDay: Record<string, number>;
  resourceStates: Record<string, ResourceState>;
  audioSettings: AudioSettings;
  characterModelId: "mira";
  playSeconds: number;
  inventory: Partial<Record<ItemId, number>>;
  lumen: number;
  dayMinute: number;
  day: number;
  quests: Record<QuestId, QuestProgress>;
  placedFurniture: PlacedFurniture[];
  islandLevel: IslandRank;
  unlockedRecipes: FurnitureId[];
  collectionMilestones: number[];
  groveRepairs: number;
  groveQuestComplete: boolean;
  bridgeRepaired: boolean;
  unlockedCollectionHintIds: string[];
  residentFriendship: Record<ResidentId, number>;
  residentLastTalkDay: Partial<Record<ResidentId, number>>;
  nollaMemorySeen: boolean;
  dailyGoalsStartDay: number | null;
  journeyGoal: JourneyGoalState;
  totalGathered: number;
  totalCrafted: number;
  lastSavedAt: number;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  reading: string;
  description: string;
  color: string;
  category: "resource" | "furniture";
}

export interface RecipeDefinition {
  id: FurnitureId;
  result: FurnitureId;
  name: string;
  description: string;
  cost: Partial<Record<ResourceId, number>>;
}

export interface QuestDefinition {
  id: QuestId;
  resident: "ノラ" | "カイ" | "セラ";
  title: string;
  reading: string;
  description: string;
  goalLabel: string;
  target: number;
  reward: number;
}

export type GameEvent =
  | { type: "gather"; item: ResourceId; amount: number }
  | { type: "craft"; item: FurnitureId }
  | { type: "place"; item: FurnitureId }
  | { type: "talk"; resident: "ノラ" | "カイ" | "セラ" };

export interface CharacterPalette {
  id: "mira" | "nolla" | "kai" | "sera";
  name: string;
  role: string;
  skin: string;
  hair: string;
  primary: string;
  secondary: string;
  accent: string;
  silhouette: "curious" | "sturdy" | "nimble" | "gentle";
}
