import type { AnimationName } from "@/src/game/types";

export type CharacterId = "mira" | "nolla" | "kai" | "sera";

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  role: string;
  modelPath: string;
  scale: number;
  yOffset: number;
  rotationOffset: number;
  animationMappings: Record<AnimationName, string>;
  colliderSize: {
    radius: number;
    height: number;
  };
  shadowSettings: {
    cast: boolean;
    receive: boolean;
  };
  expressionMappings: {
    blinkAnimation: string;
  };
}

const animations: Record<AnimationName, string> = {
  idle: "idle",
  walk: "walk",
  run: "run",
  talk: "talk",
  interact: "interact",
  pickup: "pickup",
  happy: "happy",
  surprised: "surprised",
  blink: "blink",
};

export const CHARACTER_CONFIGS: Record<CharacterId, CharacterConfig> = {
  mira: {
    id: "mira",
    name: "ミラ",
    role: "島にやってきた つくり手",
    modelPath: "/assets/characters/models/mira.glb",
    scale: 1,
    yOffset: 0.04,
    rotationOffset: 0,
    animationMappings: animations,
    colliderSize: { radius: 0.48, height: 2.7 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "blink" },
  },
  nolla: {
    id: "nolla",
    name: "ノラ",
    role: "木工がとくいな ヤギ",
    modelPath: "/assets/characters/models/nolla.glb",
    scale: 1,
    yOffset: 0.02,
    rotationOffset: 0,
    animationMappings: animations,
    colliderSize: { radius: 0.54, height: 2.8 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "blink" },
  },
  kai: {
    id: "kai",
    name: "カイ",
    role: "水べにくわしい カワウソ",
    modelPath: "/assets/characters/models/kai.glb",
    scale: 0.98,
    yOffset: 0.03,
    rotationOffset: 0,
    animationMappings: animations,
    colliderSize: { radius: 0.5, height: 2.65 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "blink" },
  },
  sera: {
    id: "sera",
    name: "セラ",
    role: "植物をしらべる フクロウ",
    modelPath: "/assets/characters/models/sera.glb",
    scale: 0.96,
    yOffset: 0.02,
    rotationOffset: 0,
    animationMappings: animations,
    colliderSize: { radius: 0.52, height: 2.65 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "blink" },
  },
};

export const CHARACTER_ORDER: CharacterId[] = [
  "mira",
  "nolla",
  "kai",
  "sera",
];

export function getCharacterConfig(id: CharacterId): CharacterConfig {
  return CHARACTER_CONFIGS[id];
}

export function resolveAnimationName(
  config: CharacterConfig,
  animation: AnimationName,
): string {
  return config.animationMappings[animation];
}
