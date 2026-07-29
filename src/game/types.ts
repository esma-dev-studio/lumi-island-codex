export type ResourceId =
  | "wood"
  | "stone"
  | "berry"
  | "herb"
  | "shell"
  | "glowcap"
  | "reed"
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
  | "harbor-sign";

export type ItemId = ResourceId | FurnitureId;
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
  | "surprised";

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

export interface GameState {
  version: 1;
  playerPosition: Position2D;
  inventory: Partial<Record<ItemId, number>>;
  lumen: number;
  dayMinute: number;
  day: number;
  quests: Record<QuestId, QuestProgress>;
  placedFurniture: PlacedFurniture[];
  islandLevel: number;
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
