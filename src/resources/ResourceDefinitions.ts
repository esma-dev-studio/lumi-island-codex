import type { Position2D, ResourceId } from "@/src/game/types";

export type ResourceVisualType =
  | "cedar-tree"
  | "moon-rock"
  | "berry-bush"
  | "herb-patch"
  | "shell-patch"
  | "glowcap-patch"
  | "reed-patch"
  | "fishing-spot";

export type ResourceUnlockRequirement =
  | "bridge"
  | "collection-50"
  | "collection-75"
  | "grove-1"
  | "grove-2"
  | "grove-3";

export type ResourceColliderDefinition = (
  | { kind: "circle"; radius: number }
  | { kind: "ellipse"; radiusX: number; radiusZ: number }
) & { offset?: Position2D };

export interface ResourceDefinition {
  id: string;
  item: ResourceId;
  position: Position2D;
  rotation?: number;
  visualType: ResourceVisualType;
  visualIndex: number;
  collider?: ResourceColliderDefinition;
  interactionRadius: number;
  recoverySeconds: number;
  placeHint: string;
  legacyIds: readonly string[];
  depletedLabel: string;
  recoveringLabel: string;
  unlockRequirement?: ResourceUnlockRequirement;
  timeWindow?: "night";
  fishHabitat?: "pond" | "harbor";
}

const recovery: Record<ResourceId, number> = {
  wood: 180,
  stone: 150,
  berry: 90,
  herb: 75,
  shell: 100,
  glowcap: 90,
  reed: 80,
  starleaf: 90,
  moonpetal: 120,
  stardew: 120,
  fish: 75,
};

const labels: Record<ResourceId, { depleted: string; recovering: string }> = {
  wood: { depleted: "えだを集めた木", recovering: "えだが育っている木" },
  stone: { depleted: "ひびの入った石", recovering: "きらめきが戻っている石" },
  berry: { depleted: "実をつんだ木", recovering: "実が育っている木" },
  herb: { depleted: "つんだあとの草", recovering: "葉が育っている草" },
  shell: { depleted: "貝をひろった浜", recovering: "波が貝を運んでいる浜" },
  glowcap: { depleted: "つんだあとのキノコ", recovering: "光が戻っているキノコ" },
  reed: { depleted: "刈ったあとの水べ草", recovering: "水べ草が育っている" },
  starleaf: { depleted: "つんだあとの星しずく草", recovering: "星しずく草が育っている" },
  moonpetal: { depleted: "花をつんだ月あかり花", recovering: "月あかり花が育っている" },
  stardew: { depleted: "つんだあとの星つゆ草", recovering: "星つゆ草が育っている" },
  fish: { depleted: "魚がいない水面", recovering: "魚が戻ってきている水面" },
};

const prefix: Record<ResourceVisualType, string> = {
  "cedar-tree": "wood-cedar",
  "moon-rock": "stone-moon",
  "berry-bush": "berry-grove",
  "herb-patch": "herb-meadow",
  "shell-patch": "shell-beach",
  "glowcap-patch": "glowcap-forest",
  "reed-patch": "reed-pond",
  "fishing-spot": "fish-moon-pond",
};

interface DefinitionOptions {
  id?: string;
  unlockRequirement?: ResourceUnlockRequirement;
  timeWindow?: "night";
  fishHabitat?: "pond" | "harbor";
}

function definition(
  item: ResourceId,
  visualType: ResourceVisualType,
  visualIndex: number,
  position: Position2D,
  interactionRadius: number,
  placeHint: string,
  legacyId: string,
  collider?: ResourceColliderDefinition,
  options: DefinitionOptions = {},
): ResourceDefinition {
  return {
    id: options.id ?? `${prefix[visualType]}-${String(visualIndex + 1).padStart(2, "0")}`,
    item,
    position,
    visualType,
    visualIndex,
    collider,
    interactionRadius,
    recoverySeconds: recovery[item],
    placeHint,
    legacyIds: legacyId ? [legacyId] : [],
    depletedLabel: labels[item].depleted,
    recoveringLabel: labels[item].recovering,
    unlockRequirement: options.unlockRequirement,
    timeWindow: options.timeWindow,
    fishHabitat: options.fishHabitat,
  };
}

const points = (
  item: ResourceId,
  visualType: ResourceVisualType,
  positions: readonly (readonly [number, number])[],
  interactionRadius: number,
  placeHint: string,
  legacyPrefix: string,
  collider?: ResourceColliderDefinition,
): ResourceDefinition[] =>
  positions.map(([x, z], index) =>
    definition(
      item,
      visualType,
      index,
      { x, z },
      interactionRadius,
      placeHint,
      `${legacyPrefix}-${index}`,
      collider,
    ),
  );

export const RESOURCE_WORLD_DEFINITIONS: readonly ResourceDefinition[] = [
  ...points("wood", "cedar-tree", [
    [-13, -4], [-11, -7], [-7, -8.8], [-4, -9.4], [10.8, -5.8],
    [13.2, -2.5], [-14, 1], [14.5, 2], [-7.7, 7.6],
  ], 2.2, "島の外がわにある大きな木", "cedar-tree", { kind: "circle", radius: 0.48 }),
  ...points("stone", "moon-rock", [
    [-5.3, 4.5], [8, 7], [11.4, -0.8], [-3, -7.2],
  ], 2, "広場や森の近く", "rock-cluster", { kind: "ellipse", radiusX: 0.78, radiusZ: 0.62 }),
  ...points("berry", "berry-bush", [
    [-7.5, 1.6], [5, 4.9], [7.5, -4.2],
  ], 1.8, "森の木かげ", "berry-bush"),
  ...points("herb", "herb-patch", [
    [-1.8, 3.2], [3.6, -2], [1.8, -7.2],
  ], 1.6, "草原", "herb-patch"),
  ...points("shell", "shell-patch", [
    [-13.6, 6.6], [13.8, 6.2], [9.4, 9],
  ], 1.6, "砂浜", "shell-patch"),
  ...points("glowcap", "glowcap-patch", [
    [-10.2, -4.2], [-5.4, -5.7], [8.5, -6.3],
  ], 1.6, "森の奥", "glowcap-patch"),
  ...points("reed", "reed-patch", [
    [-10.7, -2], [-6.4, -4.2],
  ], 1.7, "月の池のそば", "reed-patch"),
  definition(
    "fish",
    "fishing-spot",
    0,
    { x: -8, z: 1.2 },
    2.2,
    "月の池",
    "fishing-spot",
    {
      kind: "ellipse",
      radiusX: 3.55,
      radiusZ: 2.55,
      offset: { x: 0, z: -3.2 },
    },
    { fishHabitat: "pond" },
  ),
  definition("berry", "berry-bush", 30, { x: -12.3, z: -5.6 }, 1.8, "元気になった森", "", undefined, {
    id: "berry-restored-grove-01",
    unlockRequirement: "grove-1",
  }),
  definition("herb", "herb-patch", 31, { x: -9.5, z: -7.1 }, 1.6, "元気になった森", "", undefined, {
    id: "herb-restored-grove-01",
    unlockRequirement: "grove-2",
  }),
  definition("glowcap", "glowcap-patch", 32, { x: -12.8, z: -7.3 }, 1.6, "元気になった森", "", undefined, {
    id: "glowcap-restored-grove-01",
    unlockRequirement: "grove-3",
  }),
  definition("starleaf", "herb-patch", 40, { x: 14.3, z: -4.3 }, 1.7, "橋の先の小島", "", undefined, {
    id: "starleaf-bridge-islet-01",
    unlockRequirement: "bridge",
  }),
  definition("fish", "fishing-spot", 1, { x: 9.5, z: -5.2 }, 2.2, "海辺の釣りデッキ", "", undefined, {
    id: "fish-harbor-deck-01",
    unlockRequirement: "collection-50",
    fishHabitat: "harbor",
  }),
  definition("moonpetal", "glowcap-patch", 50, { x: -5.8, z: -8.3 }, 1.6, "夜にひらく花の庭", "", undefined, {
    id: "moonpetal-night-garden-01",
    unlockRequirement: "collection-75",
    timeWindow: "night",
  }),
  definition("stardew", "herb-patch", 51, { x: -4.6, z: -8.9 }, 1.6, "夜にひらく花の庭", "", undefined, {
    id: "stardew-night-garden-01",
    unlockRequirement: "collection-75",
    timeWindow: "night",
  }),
];

const byId = new Map(RESOURCE_WORLD_DEFINITIONS.map((entry) => [entry.id, entry]));
const legacyToStable = new Map(
  RESOURCE_WORLD_DEFINITIONS.flatMap((entry) => {
    const layoutLegacy =
      entry.visualType === "cedar-tree"
        ? [`tree-${entry.visualIndex}`]
        : entry.visualType === "moon-rock"
          ? [`rock-${entry.visualIndex}`]
          : [];
    return [...entry.legacyIds, ...layoutLegacy].map(
      (legacyId) => [legacyId, entry.id] as const,
    );
  }),
);

export function resourceDefinitionById(id: string): ResourceDefinition | undefined {
  return byId.get(id);
}

export function stableResourceId(id: string): string {
  return legacyToStable.get(id) ?? id;
}

export function recoverySecondsFor(item: ResourceId): number {
  return recovery[item];
}