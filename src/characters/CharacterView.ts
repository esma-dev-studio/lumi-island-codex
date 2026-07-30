import {
  AbstractMesh,
  Scene,
  ShadowGenerator,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { AnimationName } from "@/src/game/types";
import type { CharacterConfig } from "@/src/characters/CharacterConfig";
import {
  CharacterAssetLoadError,
  loadCharacterAsset,
} from "@/src/characters/CharacterAssetLoader";
import { CharacterAnimationController } from "@/src/characters/CharacterAnimationController";

export type CharacterLoadStatus = "loading" | "ready" | "error";

export interface CharacterMetrics {
  triangles: number;
  meshes: number;
  materials: number;
  textureBytes: number;
}

export interface CharacterView {
  root: TransformNode;
  ready: Promise<boolean>;
  getStatus: () => CharacterLoadStatus;
  getError: () => CharacterAssetLoadError | null;
  getMeshes: () => AbstractMesh[];
  getMetrics: () => CharacterMetrics;
  setAnimation: (name: AnimationName, speed?: number, force?: boolean) => void;
  playBlink: () => void;
  update: (deltaSeconds: number) => void;
  setEnabled: (enabled: boolean) => void;
  dispose: () => void;
}

const EMPTY_METRICS: CharacterMetrics = {
  triangles: 0,
  meshes: 0,
  materials: 0,
  textureBytes: 0,
};

export function createCharacterView(
  scene: Scene,
  config: CharacterConfig,
  position: Vector3,
  worldScale: number,
  shadowGenerator?: ShadowGenerator,
  onStatus?: (
    status: CharacterLoadStatus,
    error?: CharacterAssetLoadError,
  ) => void,
): CharacterView {
  const root = new TransformNode(`${config.id}-character-view`, scene);
  root.position = position.add(new Vector3(0, config.yOffset, 0));
  root.scaling.setAll(worldScale * config.scale);
  root.rotation.y = config.rotationOffset;
  let status: CharacterLoadStatus = "loading";
  let error: CharacterAssetLoadError | null = null;
  let meshes: AbstractMesh[] = [];
  let animationController: CharacterAnimationController | null = null;
  let queuedAnimation: {
    name: AnimationName;
    speed: number;
    force: boolean;
  } = { name: "idle", speed: 1, force: true };
  let metrics = EMPTY_METRICS;
  let disposed = false;

  onStatus?.("loading");
  const ready = loadCharacterAsset(scene, config)
    .then((asset) => {
      if (disposed) {
        asset.animationGroups.forEach((group) => group.dispose());
        asset.meshes.forEach((mesh) => mesh.dispose(false, true));
        return false;
      }
      const importedNodes = [
        ...asset.transformNodes,
        ...asset.meshes,
      ].filter((node) => !node.parent);
      importedNodes.forEach((node) => {
        node.parent = root;
      });
      meshes = asset.meshes.filter(
        (mesh) => mesh.getTotalVertices() > 0,
      );
      meshes.forEach((mesh) => {
        mesh.isPickable = false;
        mesh.receiveShadows = config.shadowSettings.receive;
        if (shadowGenerator && config.shadowSettings.cast) {
          shadowGenerator.addShadowCaster(mesh);
        }
      });
      const materialSet = new Set(
        meshes.flatMap((mesh) =>
          mesh.material ? [mesh.material.uniqueId] : [],
        ),
      );
      const textureSet = new Set(
        meshes.flatMap((mesh) => mesh.material?.getActiveTextures() ?? []),
      );
      metrics = {
        triangles: meshes.reduce(
          (total, mesh) => total + mesh.getTotalIndices() / 3,
          0,
        ),
        meshes: meshes.length,
        materials: materialSet.size,
        textureBytes: [...textureSet].reduce((total, texture) => {
          const size = texture.getSize();
          return total + size.width * size.height * 4;
        }, 0),
      };
      animationController = new CharacterAnimationController(
        scene,
        asset.animationGroups,
        config,
      );
      animationController.play(
        queuedAnimation.name,
        queuedAnimation.speed,
        queuedAnimation.force,
      );
      status = "ready";
      onStatus?.("ready");
      return true;
    })
    .catch((cause: unknown) => {
      error =
        cause instanceof CharacterAssetLoadError
          ? cause
          : new CharacterAssetLoadError(config.id, config.modelPath, {
              cause,
            });
      status = "error";
      root.setEnabled(false);
      onStatus?.("error", error);
      return false;
    });

  return {
    root,
    ready,
    getStatus: () => status,
    getError: () => error,
    getMeshes: () => meshes,
    getMetrics: () => metrics,
    setAnimation: (name, speed = 1, force = false) => {
      queuedAnimation = { name, speed, force };
      animationController?.play(name, speed, force);
    },
    playBlink: () => animationController?.playBlink(),
    update: (deltaSeconds) => animationController?.update(deltaSeconds),
    setEnabled: (enabled) => root.setEnabled(enabled && status !== "error"),
    dispose: () => {
      disposed = true;
      animationController?.dispose();
      root.dispose(false, true);
      meshes = [];
    },
  };
}
