import type { FurnitureId, ResidentId, ResourceId } from "@/src/game/types";

export type TutorialEvent =
  | { type: "move"; distance: number }
  | {
      type: "hint";
      sourceId: string;
      item?: ResourceId;
      resident?: ResidentId;
    }
  | { type: "gather"; sourceId: string; item: ResourceId }
  | { type: "inventory" }
  | { type: "craft"; item: FurnitureId }
  | { type: "place"; item: FurnitureId }
  | { type: "talk"; resident: ResidentId };

export interface TutorialStep {
  id: TutorialEvent["type"];
  title: string;
  easyTitle: string;
  keyLabel: string;
}

export const TUTORIAL_TREE_SOURCE_ID = "wood-cedar-09";
export const TUTORIAL_FURNITURE_ID: FurnitureId = "twig-stool";
export const TUTORIAL_RESIDENT_ID: ResidentId = "ノラ";

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "move",
    title: "矢印で すこし歩こう",
    easyTitle: "やじるしで すこし あるこう",
    keyLabel: "↑ ↓ ← →",
  },
  {
    id: "hint",
    title: "金色に光る 木へ ちかづこう",
    easyTitle: "きんいろに ひかる 木へ いこう",
    keyLabel: "↑ ↓ ← →",
  },
  {
    id: "gather",
    title: "光る木を しらべて、えだを集めよう",
    easyTitle: "ひかる 木で「しらべる」を おそう",
    keyLabel: "E / しらべる",
  },
  {
    id: "inventory",
    title: "バッグを ひらこう",
    easyTitle: "バッグを ひらこう",
    keyLabel: "バッグ",
  },
  {
    id: "craft",
    title: "小えだのいすを つくろう",
    easyTitle: "こえだの いすを つくろう",
    keyLabel: "つくる",
  },
  {
    id: "place",
    title: "小えだのいすを おこう",
    easyTitle: "こえだの いすを おこう",
    keyLabel: "ここに置く",
  },
  {
    id: "talk",
    title: "ノラに はなしかけよう",
    easyTitle: "ノラと はなそう",
    keyLabel: "はなす",
  },
];