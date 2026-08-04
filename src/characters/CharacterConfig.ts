import type { AnimationName } from "@/src/game/types";
import { publicAsset } from "@/src/config/publicPath";

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

const productionAnimations = {
  mira: {
    idle: "Idle", walk: "Walk", run: "Run", talk: "Idle_Attacking",
    interact: "Punch", pickup: "PickUp", happy: "Roll", surprised: "RecieveHit",
    blink: "", chop: "Bow_Shoot", mine: "RecieveHit_2", fish: "Bow_Draw", wave: "Idle_Weapon",
  },
  nolla: {
    idle: "Idle", walk: "Walk", run: "Run", talk: "Idle_Attacking",
    interact: "Attack", pickup: "PickUp", happy: "Roll", surprised: "RecieveHit",
    blink: "", chop: "Attack2", mine: "Punch", fish: "RecieveHit_2", wave: "Idle_Attacking",
  },
  kai: {
    idle: "Idle", walk: "Walk", run: "Run", talk: "Attacking_Idle",
    interact: "Punch", pickup: "PickUp", happy: "Roll", surprised: "RecieveHit",
    blink: "", chop: "Dagger_Attack", mine: "Dagger_Attack2", fish: "RecieveHit_2", wave: "Attacking_Idle",
  },
  sera: {
    idle: "Idle", walk: "Walk", run: "Run", talk: "Idle_Weapon",
    interact: "Staff_Attack", pickup: "PickUp", happy: "Spell1", surprised: "RecieveHit",
    blink: "", chop: "Punch", mine: "RecieveHit_Attacking", fish: "Spell1", wave: "Idle_Weapon",
  },
} satisfies Record<CharacterId, Record<AnimationName, string>>;

export const CHARACTER_CONFIGS: Record<CharacterId, CharacterConfig> = {
  mira: {
    id: "mira",
    name: "ミラ",
    role: "島にやってきた つくり手",
    modelPath: publicAsset("/assets/characters/models/mira.glb"),
    scale: 1,
    yOffset: 0.04,
    rotationOffset: 0,
    animationMappings: productionAnimations.mira,
    colliderSize: { radius: 0.48, height: 2.7 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "" },
  },
  nolla: {
    id: "nolla",
    name: "ノラ",
    role: "木工がとくいな ヤギ",
    modelPath: publicAsset("/assets/characters/models/nolla.glb"),
    scale: 1,
    yOffset: 0.02,
    rotationOffset: 0,
    animationMappings: productionAnimations.nolla,
    colliderSize: { radius: 0.54, height: 2.8 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "" },
  },
  kai: {
    id: "kai",
    name: "カイ",
    role: "水べにくわしい カワウソ",
    modelPath: publicAsset("/assets/characters/models/kai.glb"),
    scale: 0.98,
    yOffset: 0.03,
    rotationOffset: 0,
    animationMappings: productionAnimations.kai,
    colliderSize: { radius: 0.5, height: 2.65 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "" },
  },
  sera: {
    id: "sera",
    name: "セラ",
    role: "植物をしらべる フクロウ",
    modelPath: publicAsset("/assets/characters/models/sera.glb"),
    scale: 0.96,
    yOffset: 0.02,
    rotationOffset: 0,
    animationMappings: productionAnimations.sera,
    colliderSize: { radius: 0.52, height: 2.65 },
    shadowSettings: { cast: true, receive: true },
    expressionMappings: { blinkAnimation: "" },
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
