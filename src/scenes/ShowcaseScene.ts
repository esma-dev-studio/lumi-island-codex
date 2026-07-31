import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
  CHARACTER_ORDER,
  getCharacterConfig,
  type CharacterId,
} from "@/src/characters/CharacterConfig";
import {
  createCharacterView,
  type CharacterLoadStatus,
  type CharacterMetrics,
} from "@/src/characters/CharacterView";
import type { AnimationName } from "@/src/game/types";

function makeMaterial(
  scene: Scene,
  name: string,
  diffuse: string,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(diffuse);
  material.roughness = 0.86;
  return material;
}

function setMaterial(mesh: Mesh, material: StandardMaterial): Mesh {
  mesh.material = material;
  return mesh;
}
export interface ShowcaseController {
  scene: Scene;
  selectCharacter: (index: number) => void;
  setAnimation: (animation: AnimationName) => void;
  setTime: (time: ShowcaseTime) => void;
  setView: (view: ShowcaseView) => void;
  setCompare: (enabled: boolean) => void;
  dispose: () => void;
}

export type ShowcaseTime = "day" | "evening" | "night";
export type ShowcaseView = "front" | "angle" | "side" | "back";

export function createShowcaseScene(
  canvas: HTMLCanvasElement,
  onFps: (fps: number) => void,
  onMetrics?: (metrics: CharacterMetrics) => void,
  onStatus?: (status: CharacterLoadStatus) => void,
): ShowcaseController {
  const engine = new Engine(canvas, true, { antialias: true });
  engine.setHardwareScalingLevel(Math.min(1.3, 1 / window.devicePixelRatio));
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString("#dfd5bd00");
  const camera = new ArcRotateCamera(
    "showcase-camera",
    -Math.PI / 2,
    1.38,
    6.35,
    new Vector3(0, 1.8, 0),
    scene,
  );
  camera.lowerRadiusLimit = 4.9;
  camera.upperRadiusLimit = 10;
  camera.attachControl(canvas, true);
  const hemi = new HemisphericLight("showcase-fill", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.92;
  const key = new DirectionalLight(
    "showcase-key",
    new Vector3(0.35, -1, 0.7),
    scene,
  );
  key.position.set(-4, 8, -6);
  key.intensity = 1.55;
  const shadow = new ShadowGenerator(1024, key);
  shadow.useBlurExponentialShadowMap = true;
  shadow.blurKernel = 24;

  const floor = setMaterial(
    MeshBuilder.CreateCylinder(
      "showcase-floor",
      { height: 0.2, diameter: 6.2, tessellation: 64 },
      scene,
    ),
    makeMaterial(scene, "showcase-floor-material", "#b3a789"),
  );
  floor.position.y = -0.12;
  floor.receiveShadows = true;

  const loadStatus = new Map<CharacterId, CharacterLoadStatus>();
  const rigs = CHARACTER_ORDER.map((characterId, index) => {
    const rig = createCharacterView(
      scene,
      getCharacterConfig(characterId),
      new Vector3(0, 0, 0),
      0.93,
      shadow,
      (status) => {
        loadStatus.set(characterId, status);
        if (index === 0) onStatus?.(status);
      },
    );
    rig.root.rotation.y = Math.PI;
    rig.setEnabled(index === 0);
    return rig;
  });
  let selected = 0;
  let animation: AnimationName = "idle";
  let compare = false;
  let lastFps = 0;

  const reportSelected = () => {
    onStatus?.(rigs[selected].getStatus());
    onMetrics?.(rigs[selected].getMetrics());
  };
  void rigs[0].ready.then(reportSelected);

  engine.runRenderLoop(() => {
    const delta = Math.min(0.05, engine.getDeltaTime() / 1000);
    rigs[selected].setAnimation(animation);
    rigs[selected].update(delta);
    if (compare && selected !== 1) {
      rigs[1].setAnimation("idle");
      rigs[1].update(delta);
    }
    lastFps += delta;
    if (lastFps >= 1) {
      lastFps = 0;
      onFps(Math.round(engine.getFps()));
    }
    scene.render();
  });
  const resize = () => engine.resize();
  window.addEventListener("resize", resize);

  return {
    scene,
    selectCharacter: (index) => {
      rigs[selected].setEnabled(false);
      selected = index;
      rigs[selected].setEnabled(true);
      void rigs[selected].ready.then(reportSelected);
    },
    setAnimation: (next) => {
      animation = next;
    },
    setTime: (time) => {
      if (time === "day") {
        hemi.intensity = 0.92;
        key.intensity = 1.4;
        key.diffuse = Color3.FromHexString("#fff4d8");
        scene.clearColor = Color4.FromHexString("#dfd5bd00");
      } else if (time === "evening") {
        hemi.intensity = 0.58;
        key.intensity = 0.95;
        key.diffuse = Color3.FromHexString("#eab17d");
        scene.clearColor = Color4.FromHexString("#806c5b00");
      } else {
        hemi.intensity = 0.35;
        key.intensity = 0.6;
        key.diffuse = Color3.FromHexString("#8fb0bd");
        scene.clearColor = Color4.FromHexString("#203a4200");
      }
    },
    setView: (view) => {
      camera.alpha =
        view === "front"
          ? -Math.PI / 2
          : view === "angle"
            ? -Math.PI / 4
            : view === "side"
              ? 0
              : Math.PI / 2;
    },
    setCompare: (enabled) => {
      compare = enabled;
      rigs.forEach((rig) => rig.setEnabled(false));
      rigs.forEach((rig) => {
        rig.root.position.x = 0;
      });
      if (enabled) {
        selected = 0;
        rigs[0].root.position.x = -1.15;
        rigs[1].root.position.x = 1.15;
        rigs[0].setEnabled(true);
        rigs[1].setEnabled(true);
        camera.radius = 7.4;
      } else {
        rigs[selected].setEnabled(true);
        camera.radius = 6.35;
      }
      reportSelected();
    },
    dispose: () => {
      window.removeEventListener("resize", resize);
      rigs.forEach((rig) => rig.dispose());
      scene.dispose();
      engine.dispose();
    },
  };
}
