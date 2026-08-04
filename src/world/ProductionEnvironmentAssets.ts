import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { publicAsset } from "@/src/config/publicPath";

export interface EnvironmentAssetPlacement {
  id: string;
  file: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotationY?: number;
}

export const PRODUCTION_ENVIRONMENT_PLACEMENTS: readonly EnvironmentAssetPlacement[] = [
  { id: "meadow-oak", file: "tree_detailed.glb", position: { x: -4.2, y: 0.42, z: 9.4 }, scale: 1.35, rotationY: 0.4 },
  { id: "forest-oak-a", file: "tree_oak_dark.glb", position: { x: -18.2, y: 0.42, z: -0.2 }, scale: 1.45, rotationY: -0.55 },
  { id: "forest-oak-b", file: "tree_detailed.glb", position: { x: -12.8, y: 0.42, z: -6.1 }, scale: 1.2, rotationY: 1.2 },
  { id: "forest-log-stack", file: "log_stackLarge.glb", position: { x: -16.4, y: 0.44, z: -5.4 }, scale: 1.15, rotationY: 0.6 },
  { id: "forest-cliff-steps", file: "cliff_steps_stone.glb", position: { x: -21.5, y: 0.28, z: -6.8 }, scale: 1.35, rotationY: -0.2 },
  { id: "harbor-palm", file: "tree_palmDetailedShort.glb", position: { x: 18.6, y: 0.42, z: 2.8 }, scale: 1.2, rotationY: 0.55 },
  { id: "harbor-canoe", file: "canoe.glb", position: { x: 17.2, y: 0.5, z: -6.4 }, scale: 1.25, rotationY: 1.1 },
  { id: "harbor-rock", file: "rock_largeA.glb", position: { x: 20.4, y: 0.42, z: -0.2 }, scale: 1.4, rotationY: -0.7 },
  { id: "islet-bridge", file: "bridge_woodRound.glb", position: { x: 12.2, y: 0.48, z: -3.8 }, scale: 1.12, rotationY: -0.38 },
  { id: "moon-oak", file: "tree_oak_dark.glb", position: { x: -4.6, y: 0.42, z: -15.1 }, scale: 1.18, rotationY: 0.25 },
] as const;

const ASSET_ROOT = publicAsset("/assets/environment/kenney-nature-kit/");

async function loadPlacement(
  scene: Scene,
  root: TransformNode,
  placement: EnvironmentAssetPlacement,
  shadows: ShadowGenerator,
): Promise<number> {
  const holder = new TransformNode(`production-environment-${placement.id}`, scene);
  holder.parent = root;
  holder.position = new Vector3(
    placement.position.x,
    placement.position.y,
    placement.position.z,
  );
  holder.scaling.setAll(placement.scale);
  holder.rotation.y = placement.rotationY ?? 0;
  const imported = await SceneLoader.ImportMeshAsync(
    "",
    ASSET_ROOT,
    placement.file,
    scene,
  );
  const topLevelNodes = [...imported.transformNodes, ...imported.meshes].filter(
    (node) => !node.parent,
  );
  topLevelNodes.forEach((node) => {
    node.parent = holder;
  });
  imported.meshes.forEach((mesh) => {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    if (mesh.getTotalVertices() > 0) shadows.addShadowCaster(mesh);
  });
  return imported.meshes.reduce(
    (triangles, mesh) => triangles + mesh.getTotalIndices() / 3,
    0,
  );
}

export function createProductionEnvironmentAssets(
  scene: Scene,
  shadows: ShadowGenerator,
): { root: TransformNode; ready: Promise<void> } {
  const root = new TransformNode("production-environment-assets", scene);
  const ready = Promise.allSettled(
    PRODUCTION_ENVIRONMENT_PLACEMENTS.map((placement) =>
      loadPlacement(scene, root, placement, shadows),
    ),
  ).then((results) => {
    const loaded = results.filter((result) => result.status === "fulfilled");
    const triangles = loaded.reduce(
      (total, result) => total + (result.status === "fulfilled" ? result.value : 0),
      0,
    );
    scene.metadata = {
      ...(scene.metadata ?? {}),
      productionEnvironment: {
        requested: results.length,
        loaded: loaded.length,
        triangles,
        source: "Kenney Nature Kit 2.1 (CC0)",
      },
    };
  });
  return { root, ready };
}
