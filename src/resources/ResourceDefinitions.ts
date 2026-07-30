import type { ResourceId } from "@/src/game/types";

export interface ResourceDefinition {
  item: ResourceId;
  recoverySeconds: number;
  depletedLabel: string;
  recoveringLabel: string;
}

export const RESOURCE_DEFINITIONS: Record<ResourceId, ResourceDefinition> = {
  wood: {
    item: "wood",
    recoverySeconds: 180,
    depletedLabel: "えだを集めた木",
    recoveringLabel: "えだが育っている木",
  },
  stone: {
    item: "stone",
    recoverySeconds: 150,
    depletedLabel: "ひびの入った石",
    recoveringLabel: "きらめきが戻っている石",
  },
  berry: {
    item: "berry",
    recoverySeconds: 90,
    depletedLabel: "実をつんだ木",
    recoveringLabel: "実が育っている木",
  },
  herb: {
    item: "herb",
    recoverySeconds: 75,
    depletedLabel: "つんだあとの草",
    recoveringLabel: "葉が育っている草",
  },
  shell: {
    item: "shell",
    recoverySeconds: 100,
    depletedLabel: "貝をひろった浜",
    recoveringLabel: "波が貝を運んでいる浜",
  },
  glowcap: {
    item: "glowcap",
    recoverySeconds: 90,
    depletedLabel: "つんだあとのキノコ",
    recoveringLabel: "光が戻っているキノコ",
  },
  reed: {
    item: "reed",
    recoverySeconds: 80,
    depletedLabel: "刈ったあとの水べ草",
    recoveringLabel: "水べ草が育っている",
  },
  fish: {
    item: "fish",
    recoverySeconds: 75,
    depletedLabel: "魚がいない水面",
    recoveringLabel: "魚が戻ってきている水面",
  },
};

export function recoverySecondsFor(item: ResourceId): number {
  return RESOURCE_DEFINITIONS[item].recoverySeconds;
}
