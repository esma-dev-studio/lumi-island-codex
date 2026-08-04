import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

export interface ResidentMarker {
  root: TransformNode;
  sync: (position: Vector3) => void;
  dispose: () => void;
}

export function createResidentMarker(
  scene: Scene,
  label: string,
  accent: string,
): ResidentMarker {
  const root = new TransformNode("resident-marker-" + label, scene);
  const ringMaterial = new StandardMaterial("resident-ring-material-" + label, scene);
  ringMaterial.diffuseColor = Color3.FromHexString(accent);
  ringMaterial.emissiveColor = Color3.FromHexString(accent).scale(0.65);
  ringMaterial.alpha = 0.78;
  ringMaterial.disableLighting = true;
  const ring = MeshBuilder.CreateTorus(
    "resident-ring-" + label,
    { diameter: 1.15, thickness: 0.055, tessellation: 36 },
    scene,
  );
  ring.parent = root;
  ring.position.y = 0.035;
  ring.material = ringMaterial;
  ring.isPickable = false;

  const texture = new DynamicTexture(
    "resident-name-texture-" + label,
    { width: 512, height: 160 },
    scene,
    false,
  );
  texture.hasAlpha = true;
  texture.drawText(
    label,
    null,
    111,
    "bold 82px sans-serif",
    "#173f3b",
    "rgba(255, 249, 225, 0.94)",
    true,
    true,
  );
  const tagMaterial = new StandardMaterial("resident-name-material-" + label, scene);
  tagMaterial.diffuseTexture = texture;
  tagMaterial.opacityTexture = texture;
  tagMaterial.emissiveColor = new Color3(0.92, 0.92, 0.86);
  tagMaterial.disableLighting = true;
  tagMaterial.backFaceCulling = false;
  tagMaterial.useAlphaFromDiffuseTexture = true;
  const tag = MeshBuilder.CreatePlane(
    "resident-name-" + label,
    { width: 1.75, height: 0.55 },
    scene,
  );
  tag.parent = root;
  tag.position.y = 2.95;
  tag.billboardMode = Mesh.BILLBOARDMODE_ALL;
  tag.material = tagMaterial;
  tag.isPickable = false;
  tag.renderingGroupId = 2;

  return {
    root,
    sync: (position) => root.position.copyFrom(position),
    dispose: () => root.dispose(false, true),
  };
}