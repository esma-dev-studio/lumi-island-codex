import {
  AbstractMesh,
  AnimationGroup,
  Scene,
  SceneLoader,
  Skeleton,
  TransformNode,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { CharacterConfig } from "@/src/characters/CharacterConfig";

export interface LoadedCharacterAsset {
  meshes: AbstractMesh[];
  transformNodes: TransformNode[];
  skeletons: Skeleton[];
  animationGroups: AnimationGroup[];
}

export class CharacterAssetLoadError extends Error {
  constructor(
    readonly characterId: string,
    readonly modelPath: string,
    options?: { cause?: unknown },
  ) {
    super(
      `Character asset "${characterId}" could not be loaded from ${modelPath}`,
      options,
    );
    this.name = "CharacterAssetLoadError";
  }
}

function splitModelPath(modelPath: string): {
  rootUrl: string;
  fileName: string;
} {
  const separator = modelPath.lastIndexOf("/");
  return {
    rootUrl: modelPath.slice(0, separator + 1),
    fileName: modelPath.slice(separator + 1),
  };
}

export async function loadCharacterAsset(
  scene: Scene,
  config: CharacterConfig,
): Promise<LoadedCharacterAsset> {
  const { rootUrl, fileName } = splitModelPath(config.modelPath);
  try {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      rootUrl,
      fileName,
      scene,
    );
    const animationNames = new Set(
      result.animationGroups.map((group) => group.name),
    );
    const missing = Object.values(config.animationMappings).filter(
      (name) => !animationNames.has(name),
    );
    if (missing.length) {
      result.animationGroups.forEach((group) => group.dispose());
      result.meshes.forEach((mesh) => mesh.dispose(false, true));
      throw new Error(`Missing animations: ${missing.join(", ")}`);
    }
    return {
      meshes: result.meshes,
      transformNodes: result.transformNodes,
      skeletons: result.skeletons,
      animationGroups: result.animationGroups,
    };
  } catch (error) {
    if (error instanceof CharacterAssetLoadError) throw error;
    throw new CharacterAssetLoadError(config.id, config.modelPath, {
      cause: error,
    });
  }
}
