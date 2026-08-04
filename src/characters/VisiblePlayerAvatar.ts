import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Scene } from "@babylonjs/core/scene";
import type { AnimationName } from "@/src/game/types";

export interface VisiblePlayerAvatarPose {
  armSwing: number;
  legSwing: number;
  bob: number;
  bodyLean: number;
}

export function visiblePlayerAvatarPose(
  animation: AnimationName,
  phase: number,
): VisiblePlayerAvatarPose {
  if (animation === "walk" || animation === "run") {
    const strength = animation === "run" ? 0.78 : 0.52;
    return {
      armSwing: Math.sin(phase) * strength,
      legSwing: Math.sin(phase) * strength * 0.72,
      bob: Math.abs(Math.sin(phase)) * (animation === "run" ? 0.085 : 0.05),
      bodyLean: animation === "run" ? 0.11 : 0.035,
    };
  }
  if (["interact", "pickup", "chop", "mine", "fish", "wave"].includes(animation)) {
    return {
      armSwing: -0.68 + Math.sin(phase * 1.6) * 0.22,
      legSwing: 0,
      bob: Math.sin(phase * 1.6) * 0.025,
      bodyLean: 0.08,
    };
  }
  if (animation === "happy") {
    return { armSwing: -1.42, legSwing: 0, bob: Math.abs(Math.sin(phase * 1.9)) * 0.11, bodyLean: 0 };
  }
  return {
    armSwing: Math.sin(phase * 0.65) * 0.045,
    legSwing: 0,
    bob: Math.sin(phase * 0.65) * 0.015,
    bodyLean: 0,
  };
}

export function createVisiblePlayerAvatar(
  scene: Scene,
  position: Vector3,
  shadows?: ShadowGenerator,
) {
  const root = new TransformNode("visible-player-avatar", scene);
  const body = new TransformNode("visible-player-body-pivot", scene);
  const leftArm = new TransformNode("visible-player-left-arm", scene);
  const rightArm = new TransformNode("visible-player-right-arm", scene);
  const leftLeg = new TransformNode("visible-player-left-leg", scene);
  const rightLeg = new TransformNode("visible-player-right-leg", scene);
  body.parent = root;
  leftArm.parent = body;
  rightArm.parent = body;
  leftLeg.parent = root;
  rightLeg.parent = root;

  const makeMaterial = (name: string, color: string) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = Color3.FromHexString(color);
    material.specularColor = Color3.FromHexString("#2d3b42").scale(0.12);
    return material;
  };
  const material = {
    skin: makeMaterial("visible-player-skin", "#f2b58f"),
    hair: makeMaterial("visible-player-hair", "#243f55"),
    jacket: makeMaterial("visible-player-jacket", "#f5c84b"),
    jacketLight: makeMaterial("visible-player-jacket-light", "#ffe486"),
    shorts: makeMaterial("visible-player-shorts", "#287f86"),
    scarf: makeMaterial("visible-player-scarf", "#e8664d"),
    boots: makeMaterial("visible-player-boots", "#6b4938"),
    pack: makeMaterial("visible-player-pack", "#d9584b"),
    eye: makeMaterial("visible-player-eye", "#19313c"),
    cheek: makeMaterial("visible-player-cheek", "#e9857d"),
  };
  const finish = (mesh: Mesh, parent: TransformNode, paint: StandardMaterial) => {
    mesh.parent = parent;
    mesh.material = paint;
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    mesh.renderOutline = true;
    mesh.outlineColor = Color3.FromHexString("#29434a");
    mesh.outlineWidth = 0.025;
    shadows?.addShadowCaster(mesh);
    return mesh;
  };

  const torso = finish(
    MeshBuilder.CreateCapsule("visible-player-torso", { height: 0.9, radius: 0.34, tessellation: 18 }, scene),
    body,
    material.jacket,
  );
  torso.position.y = 1.08;
  torso.scaling.z = 0.82;

  const jacketPanel = finish(
    MeshBuilder.CreateBox("visible-player-jacket-panel", { width: 0.34, height: 0.5, depth: 0.035 }, scene),
    body,
    material.jacketLight,
  );
  jacketPanel.position.set(0, 1.08, 0.3);

  const shorts = finish(
    MeshBuilder.CreateCapsule("visible-player-shorts", { height: 0.42, radius: 0.3, tessellation: 16 }, scene),
    body,
    material.shorts,
  );
  shorts.position.y = 0.72;
  shorts.scaling.z = 0.82;

  const backpack = finish(
    MeshBuilder.CreateCapsule("visible-player-backpack", { height: 0.64, radius: 0.27, tessellation: 16 }, scene),
    body,
    material.pack,
  );
  backpack.position.set(0, 1.12, -0.28);
  backpack.scaling.z = 0.58;

  const hair = finish(MeshBuilder.CreateSphere("visible-player-hair", { diameter: 0.86, segments: 20 }, scene), body, material.hair);
  hair.position.y = 1.88;
  const face = finish(MeshBuilder.CreateSphere("visible-player-face", { diameter: 0.72, segments: 20 }, scene), body, material.skin);
  face.position.set(0, 1.84, 0.115);
  face.scaling.z = 0.92;
  const fringe = finish(MeshBuilder.CreateSphere("visible-player-fringe", { diameter: 0.42, segments: 14 }, scene), body, material.hair);
  fringe.position.set(-0.12, 2.12, 0.27);
  fringe.scaling.set(1.25, 0.48, 0.45);
  fringe.rotation.z = -0.18;

  [-1, 1].forEach((side) => {
    const eye = finish(MeshBuilder.CreateSphere(`visible-player-eye-${side}`, { diameter: 0.09, segments: 10 }, scene), body, material.eye);
    eye.position.set(side * 0.135, 1.9, 0.46);
    eye.scaling.set(0.8, 1.12, 0.48);
    const cheek = finish(MeshBuilder.CreateSphere(`visible-player-cheek-${side}`, { diameter: 0.075, segments: 8 }, scene), body, material.cheek);
    cheek.position.set(side * 0.235, 1.79, 0.43);
    cheek.scaling.set(1.25, 0.52, 0.35);
  });
  const mouth = finish(MeshBuilder.CreateSphere("visible-player-mouth", { diameter: 0.07, segments: 8 }, scene), body, material.eye);
  mouth.position.set(0, 1.76, 0.47);
  mouth.scaling.set(1.35, 0.42, 0.35);

  const scarf = finish(MeshBuilder.CreateTorus("visible-player-scarf", { diameter: 0.5, thickness: 0.09, tessellation: 20 }, scene), body, material.scarf);
  scarf.position.y = 1.48;
  scarf.scaling.z = 0.82;
  const scarfTail = finish(MeshBuilder.CreateBox("visible-player-scarf-tail", { width: 0.14, height: 0.4, depth: 0.08 }, scene), body, material.scarf);
  scarfTail.position.set(-0.25, 1.33, -0.16);
  scarfTail.rotation.z = -0.2;

  const addArm = (pivot: TransformNode, side: number) => {
    pivot.position.set(side * 0.4, 1.37, 0);
    pivot.rotation.z = side * -0.08;
    const sleeve = finish(MeshBuilder.CreateCapsule(`visible-player-sleeve-${side}`, { height: 0.62, radius: 0.115, tessellation: 14 }, scene), pivot, material.jacket);
    sleeve.position.y = -0.26;
    const hand = finish(MeshBuilder.CreateSphere(`visible-player-hand-${side}`, { diameter: 0.22, segments: 12 }, scene), pivot, material.skin);
    hand.position.y = -0.58;
  };
  addArm(leftArm, -1);
  addArm(rightArm, 1);

  const addLeg = (pivot: TransformNode, side: number) => {
    pivot.position.set(side * 0.18, 0.61, 0);
    const leg = finish(MeshBuilder.CreateCapsule(`visible-player-leg-${side}`, { height: 0.55, radius: 0.11, tessellation: 14 }, scene), pivot, material.skin);
    leg.position.y = -0.23;
    const boot = finish(MeshBuilder.CreateSphere(`visible-player-boot-${side}`, { diameter: 0.36, segments: 12 }, scene), pivot, material.boots);
    boot.position.set(0, -0.51, 0.08);
    boot.scaling.set(0.86, 0.56, 1.18);
  };
  addLeg(leftLeg, -1);
  addLeg(rightLeg, 1);

  const basePosition = position.clone();
  root.position.copyFrom(basePosition);
  let phase = 0;

  return {
    root,
    setEnabled(enabled: boolean) {
      root.setEnabled(enabled);
    },
    sync(nextPosition: Vector3, facing: number) {
      basePosition.copyFrom(nextPosition);
      root.rotation.y = facing;
    },
    update(animation: AnimationName, deltaSeconds: number) {
      phase += deltaSeconds * (animation === "run" ? 11 : animation === "walk" ? 7.5 : 3.2);
      const pose = visiblePlayerAvatarPose(animation, phase);
      root.position.copyFrom(basePosition);
      root.position.y += pose.bob;
      body.rotation.x = pose.bodyLean;
      leftArm.rotation.x = pose.armSwing;
      rightArm.rotation.x = -pose.armSwing;
      leftLeg.rotation.x = -pose.legSwing;
      rightLeg.rotation.x = pose.legSwing;
    },
    dispose() {
      root.dispose(false, true);
      Object.values(material).forEach((entry) => entry.dispose());
    },
  };
}
