export type TutorialEvent =
  | { type: "move"; distance: number }
  | { type: "hint" }
  | { type: "gather" }
  | { type: "inventory" }
  | { type: "craft" }
  | { type: "place" }
  | { type: "talk" };

export interface TutorialStep {
  id: TutorialEvent["type"];
  title: string;
  easyTitle: string;
  keyLabel: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "move",
    title: "矢印キーで 3mあるこう",
    easyTitle: "やじるしで あるこう",
    keyLabel: "↑ ↓ ← →",
  },
  {
    id: "hint",
    title: "光っている 木に ちかづこう",
    easyTitle: "ひかる 木へ いこう",
    keyLabel: "↑ ↓ ← →",
  },
  {
    id: "gather",
    title: "しらべて 木のえだを 集めよう",
    easyTitle: "「しらべる」を おそう",
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
    title: "家具を 1こ つくろう",
    easyTitle: "「つくる」で かぐを つくろう",
    keyLabel: "つくる",
  },
  {
    id: "place",
    title: "つくった 家具を おこう",
    easyTitle: "かぐを おこう",
    keyLabel: "ここに置く",
  },
  {
    id: "talk",
    title: "島の 住民と はなそう",
    easyTitle: "ノラに はなしかけよう",
    keyLabel: "はなす",
  },
];
