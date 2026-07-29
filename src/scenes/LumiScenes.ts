import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { createCharacter } from "@/src/characters/CharacterFactory";
import { CHARACTERS, ITEMS } from "@/src/data/gameData";
import type {
  AnimationName,
  PlacedFurniture,
  ResourceId,
} from "@/src/game/types";

export interface InteractionHint {
  label: string;
  action: string;
}

export interface IslandSceneCallbacks {
  onHint: (hint: InteractionHint | null) => void;
  onGather: (item: ResourceId) => void;
  onTalk: (resident: "ノラ" | "カイ" | "セラ") => void;
  onPlayerMove: (position: { x: number; z: number }) => void;
  onFps: (fps: number) => void;
}

export interface IslandController {
  scene: Scene;
  setPaused: (paused: boolean) => void;
  setDayMinute: (minute: number) => void;
  syncFurniture: (placed: PlacedFurniture[]) => void;
  dispose: () => void;
}

interface Interactable {
  node: TransformNode;
  kind: "resource" | "resident";
  item?: ResourceId;
  resident?: "ノラ" | "カイ" | "セラ";
  label: string;
  radius: number;
  available: boolean;
  respawnAt: number;
}

const palette = {
  grass: "#6f8a54",
  deepGrass: "#496d51",
  sand: "#d7c28f",
  soil: "#a57b59",
  ocean: "#257b7a",
  oceanDeep: "#185b63",
  stone: "#778985",
  wood: "#865337",
  leaf: "#45694b",
  leafLight: "#789257",
  amber: "#f0b557",
  cream: "#eadcc0",
};

function makeMaterial(
  scene: Scene,
  name: string,
  color: string,
  emissive?: string,
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(color);
  mat.specularColor = new Color3(0.035, 0.035, 0.03);
  mat.roughness = 0.92;
  if (emissive) mat.emissiveColor = Color3.FromHexString(emissive);
  return mat;
}

function setMaterial(mesh: Mesh, mat: StandardMaterial): Mesh {
  mesh.material = mat;
  return mesh;
}

function createIslandBase(scene: Scene): void {
  const oceanMat = makeMaterial(scene, "deep-ocean", palette.oceanDeep);
  oceanMat.alpha = 0.96;
  const ocean = setMaterial(
    MeshBuilder.CreateCylinder(
      "ocean",
      { height: 0.18, diameter: 92, tessellation: 96 },
      scene,
    ),
    oceanMat,
  );
  ocean.position.y = -0.72;

  const shallowMat = makeMaterial(scene, "shallow-water", palette.ocean);
  shallowMat.alpha = 0.84;
  const shallows = setMaterial(
    MeshBuilder.CreateCylinder(
      "shallows",
      { height: 0.22, diameter: 49, tessellation: 96 },
      scene,
    ),
    shallowMat,
  );
  shallows.position.y = -0.56;
  shallows.scaling.z = 0.82;

  const sandMat = makeMaterial(scene, "island-sand", palette.sand);
  const sand = setMaterial(
    MeshBuilder.CreateCylinder(
      "island-sand",
      { height: 0.72, diameter: 43, tessellation: 96 },
      scene,
    ),
    sandMat,
  );
  sand.position.y = -0.35;
  sand.scaling.z = 0.78;

  const grassMat = makeMaterial(scene, "island-grass", palette.grass);
  const grass = setMaterial(
    MeshBuilder.CreateCylinder(
      "island-grass",
      { height: 0.75, diameter: 37.5, tessellation: 96 },
      scene,
    ),
    grassMat,
  );
  grass.position.y = 0;
  grass.scaling.z = 0.74;

  const soilMat = makeMaterial(scene, "path-soil", palette.soil);
  const pathPoints = [
    [0, 7, 1.7, 8.5, 0.1],
    [-3.8, 2.7, 8.5, 1.25, -0.52],
    [5, 1.5, 7.4, 1.2, 0.72],
    [-0.8, -3.2, 1.4, 7.4, 0.05],
  ];
  pathPoints.forEach(([x, z, width, depth, rotation], index) => {
    const path = setMaterial(
      MeshBuilder.CreateCapsule(
        `path-${index}`,
        { radius: 0.5, height: 2, tessellation: 18 },
        scene,
      ),
      soilMat,
    );
    path.position.set(x, 0.39, z);
    path.rotation.x = Math.PI / 2;
    path.rotation.y = rotation;
    path.scaling.set(width, 0.16, depth);
  });

  const pondMat = makeMaterial(scene, "pond-water", "#376f6d", "#071b17");
  pondMat.alpha = 0.9;
  const pond = setMaterial(
    MeshBuilder.CreateCylinder(
      "moon-pond",
      { height: 0.09, diameter: 6.7, tessellation: 42 },
      scene,
    ),
    pondMat,
  );
  pond.position.set(-8, 0.43, -2);
  pond.scaling.z = 0.7;

  const rockMat = makeMaterial(scene, "pond-stone", palette.stone);
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const stone = setMaterial(
      MeshBuilder.CreateIcoSphere(
        `pond-edge-${index}`,
        { radius: 0.42, subdivisions: 1, flat: false },
        scene,
      ),
      rockMat,
    );
    stone.position.set(
      -8 + Math.cos(angle) * 3.32,
      0.46,
      -2 + Math.sin(angle) * 2.34,
    );
    stone.scaling.set(1 + (index % 3) * 0.16, 0.6, 0.85);
    stone.rotation.y = angle;
  }
}

function createTree(
  scene: Scene,
  position: Vector3,
  mats: Record<string, StandardMaterial>,
  index: number,
): TransformNode {
  const root = new TransformNode(`cedar-tree-${index}`, scene);
  root.position = position;
  const trunk = setMaterial(
    MeshBuilder.CreateCylinder(
      `tree-trunk-${index}`,
      {
        height: 3.5,
        diameterTop: 0.48,
        diameterBottom: 0.72,
        tessellation: 10,
      },
      scene,
    ),
    mats.wood,
  );
  trunk.parent = root;
  trunk.position.y = 2.1;
  trunk.rotation.z = ((index % 3) - 1) * 0.03;

  const crownData = [
    [-0.48, 3.8, 0.08, 1.8, 1.5, 1.55],
    [0.6, 3.72, 0.18, 1.65, 1.38, 1.45],
    [0.05, 4.55, -0.12, 1.6, 1.45, 1.4],
    [-0.05, 3.35, -0.45, 1.45, 1.2, 1.25],
  ];
  crownData.forEach(([x, y, z, sx, sy, sz], crownIndex) => {
    const crown = setMaterial(
      MeshBuilder.CreateIcoSphere(
        `tree-crown-${index}-${crownIndex}`,
        { radius: 1, subdivisions: 2, flat: false },
        scene,
      ),
      crownIndex === 2 ? mats.leafLight : mats.leaf,
    );
    crown.parent = root;
    crown.position.set(x, y, z);
    crown.scaling.set(sx, sy, sz);
    crown.rotation.set(crownIndex * 0.17, index * 0.23, crownIndex * 0.1);
  });
  return root;
}

function createRockCluster(
  scene: Scene,
  position: Vector3,
  mat: StandardMaterial,
  index: number,
): TransformNode {
  const root = new TransformNode(`rock-cluster-${index}`, scene);
  root.position = position;
  const pieces = [
    [0, 0.58, 0, 1.2, 1.1, 1],
    [0.65, 0.33, 0.22, 0.7, 0.65, 0.75],
    [-0.48, 0.28, -0.2, 0.58, 0.52, 0.65],
  ];
  pieces.forEach(([x, y, z, sx, sy, sz], part) => {
    const rock = setMaterial(
      MeshBuilder.CreateIcoSphere(
        `rock-${index}-${part}`,
        { radius: 0.7, subdivisions: 1, flat: false },
        scene,
      ),
      mat,
    );
    rock.parent = root;
    rock.position.set(x, y, z);
    rock.scaling.set(sx, sy, sz);
    rock.rotation.set(part * 0.12, index * 0.4 + part, part * 0.2);
  });
  return root;
}

function createBush(
  scene: Scene,
  position: Vector3,
  leaf: StandardMaterial,
  berry: StandardMaterial,
  index: number,
): TransformNode {
  const root = new TransformNode(`berry-bush-${index}`, scene);
  root.position = position;
  const pieces = [
    [-0.42, 0.58, 0, 0.72],
    [0.35, 0.62, 0.08, 0.8],
    [0, 0.92, -0.12, 0.76],
  ];
  pieces.forEach(([x, y, z, size], part) => {
    const leaves = setMaterial(
      MeshBuilder.CreateIcoSphere(
        `bush-leaf-${index}-${part}`,
        { radius: size, subdivisions: 2, flat: false },
        scene,
      ),
      leaf,
    );
    leaves.parent = root;
    leaves.position.set(x, y, z);
    leaves.scaling.y = 0.8;
  });
  for (let dot = 0; dot < 7; dot += 1) {
    const fruit = setMaterial(
      MeshBuilder.CreateIcoSphere(
        `berry-${index}-${dot}`,
        { radius: 0.11, subdivisions: 1 },
        scene,
      ),
      berry,
    );
    fruit.parent = root;
    fruit.position.set(
      Math.sin(dot * 1.7) * 0.62,
      0.54 + (dot % 3) * 0.24,
      -0.55 + (dot % 2) * 0.16,
    );
  }
  return root;
}

function createSmallPatch(
  scene: Scene,
  position: Vector3,
  mat: StandardMaterial,
  name: string,
  index: number,
  glowing = false,
): TransformNode {
  const root = new TransformNode(`${name}-${index}`, scene);
  root.position = position;
  for (let part = 0; part < 7; part += 1) {
    const angle = (part / 7) * Math.PI * 2;
    const stem = setMaterial(
      MeshBuilder.CreateCylinder(
        `${name}-stem-${index}-${part}`,
        {
          height: 0.46 + (part % 3) * 0.12,
          diameterTop: 0.035,
          diameterBottom: 0.07,
          tessellation: 6,
        },
        scene,
      ),
      mat,
    );
    stem.parent = root;
    stem.position.set(
      Math.cos(angle) * 0.38,
      0.24,
      Math.sin(angle) * 0.31,
    );
    stem.rotation.z = Math.cos(angle) * 0.22;
    const leaf = setMaterial(
      MeshBuilder.CreateDisc(
        `${name}-leaf-${index}-${part}`,
        { radius: glowing ? 0.18 : 0.14, tessellation: 10 },
        scene,
      ),
      mat,
    );
    leaf.parent = root;
    leaf.position.set(
      Math.cos(angle) * 0.42,
      0.48 + (part % 3) * 0.1,
      Math.sin(angle) * 0.34,
    );
    leaf.rotation.x = Math.PI / 2.5;
    leaf.rotation.y = -angle;
  }
  return root;
}

function createShellPatch(
  scene: Scene,
  position: Vector3,
  mat: StandardMaterial,
  index: number,
): TransformNode {
  const root = new TransformNode(`shell-patch-${index}`, scene);
  root.position = position;
  for (let part = 0; part < 4; part += 1) {
    const shell = setMaterial(
      MeshBuilder.CreateSphere(
        `shell-${index}-${part}`,
        {
          diameter: 0.35,
          segments: 12,
          slice: 0.55,
          arc: 0.72,
        },
        scene,
      ),
      mat,
    );
    shell.parent = root;
    shell.position.set((part - 1.5) * 0.34, 0.14, (part % 2) * 0.26);
    shell.rotation.set(Math.PI / 2, part * 0.8, 0.2);
  }
  return root;
}

function createHouse(
  scene: Scene,
  position: Vector3,
  rotation: number,
  primary: StandardMaterial,
  secondary: StandardMaterial,
  roof: StandardMaterial,
  name: string,
): TransformNode {
  const root = new TransformNode(`${name}-house`, scene);
  root.position = position;
  root.rotation.y = rotation;
  const body = setMaterial(
    MeshBuilder.CreateBox(
      `${name}-walls`,
      { width: 4.2, height: 2.7, depth: 3.3 },
      scene,
    ),
    primary,
  );
  body.parent = root;
  body.position.y = 1.72;

  const roofMesh = setMaterial(
    MeshBuilder.CreateCylinder(
      `${name}-roof`,
      {
        height: 3.9,
        diameter: 4.8,
        tessellation: 3,
      },
      scene,
    ),
    roof,
  );
  roofMesh.parent = root;
  roofMesh.position.y = 3.65;
  roofMesh.rotation.z = Math.PI / 2;
  roofMesh.rotation.y = Math.PI / 2;
  roofMesh.scaling.z = 0.92;

  const door = setMaterial(
    MeshBuilder.CreateBox(
      `${name}-door`,
      { width: 0.85, height: 1.72, depth: 0.14 },
      scene,
    ),
    secondary,
  );
  door.parent = root;
  door.position.set(0.75, 1.05, -1.72);

  for (const side of [-1, 1]) {
    const windowFrame = setMaterial(
      MeshBuilder.CreateBox(
        `${name}-window-${side}`,
        { width: 0.8, height: 0.72, depth: 0.16 },
        scene,
      ),
      secondary,
    );
    windowFrame.parent = root;
    windowFrame.position.set(side * 1.15, 2.0, -1.73);
    const pane = setMaterial(
      MeshBuilder.CreateBox(
        `${name}-pane-${side}`,
        { width: 0.58, height: 0.5, depth: 0.18 },
        scene,
      ),
      makeMaterial(scene, `${name}-window-glow`, "#d8b66a", "#4a2a0e"),
    );
    pane.parent = root;
    pane.position.set(side * 1.15, 2.0, -1.8);
  }
  return root;
}

function createFurnitureMesh(
  scene: Scene,
  placed: PlacedFurniture,
  mats: Record<string, StandardMaterial>,
): TransformNode {
  const root = new TransformNode(`placed-${placed.id}`, scene);
  root.position.set(placed.position.x, 0.45, placed.position.z);
  root.rotation.y = placed.rotation;
  const wood = mats.wood;
  const stone = mats.stone;
  const glow = mats.glow;

  if (placed.type === "stone-lantern" || placed.type === "firefly-jar") {
    const base = setMaterial(
      MeshBuilder.CreateCylinder(
        `${placed.id}-base`,
        { height: 0.55, diameterTop: 0.62, diameterBottom: 0.78, tessellation: 10 },
        scene,
      ),
      placed.type === "stone-lantern" ? stone : wood,
    );
    base.parent = root;
    base.position.y = 0.28;
    const light = setMaterial(
      MeshBuilder.CreateIcoSphere(
        `${placed.id}-light`,
        { radius: 0.32, subdivisions: 2 },
        scene,
      ),
      glow,
    );
    light.parent = root;
    light.position.y = 0.78;
    return root;
  }

  if (placed.type === "picnic-table") {
    const top = setMaterial(
      MeshBuilder.CreateBox(
        `${placed.id}-top`,
        { width: 2.7, height: 0.22, depth: 1.35 },
        scene,
      ),
      wood,
    );
    top.parent = root;
    top.position.y = 1.05;
    for (const side of [-1, 1]) {
      const leg = setMaterial(
        MeshBuilder.CreateBox(
          `${placed.id}-leg-${side}`,
          { width: 0.25, height: 1, depth: 1 },
          scene,
        ),
        wood,
      );
      leg.parent = root;
      leg.position.set(side * 0.9, 0.52, 0);
      leg.rotation.z = side * 0.18;
    }
    return root;
  }

  if (placed.type === "shell-mobile" || placed.type === "harbor-sign") {
    const post = setMaterial(
      MeshBuilder.CreateCylinder(
        `${placed.id}-post`,
        { height: 2.2, diameter: 0.18, tessellation: 10 },
        scene,
      ),
      wood,
    );
    post.parent = root;
    post.position.y = 1.1;
    const sign = setMaterial(
      MeshBuilder.CreateBox(
        `${placed.id}-sign`,
        { width: 1.45, height: 0.62, depth: 0.15 },
        scene,
      ),
      placed.type === "shell-mobile" ? mats.shell : mats.leafLight,
    );
    sign.parent = root;
    sign.position.y = 1.8;
    return root;
  }

  const seat = setMaterial(
    MeshBuilder.CreateBox(
      `${placed.id}-seat`,
      {
        width: placed.type === "cedar-bench" ? 2.3 : 1.35,
        height: 0.3,
        depth: 0.85,
      },
      scene,
    ),
    placed.type === "reed-mat" ? mats.leafLight : wood,
  );
  seat.parent = root;
  seat.position.y = 0.45;
  const supportCount = placed.type === "reed-mat" ? 0 : 2;
  for (let index = 0; index < supportCount; index += 1) {
    const support = setMaterial(
      MeshBuilder.CreateCylinder(
        `${placed.id}-support-${index}`,
        { height: 0.5, diameter: 0.18, tessellation: 8 },
        scene,
      ),
      wood,
    );
    support.parent = root;
    support.position.set(index ? 0.45 : -0.45, 0.18, 0);
  }
  return root;
}

export function createIslandScene(
  canvas: HTMLCanvasElement,
  startPosition: { x: number; z: number },
  initialFurniture: PlacedFurniture[],
  callbacks: IslandSceneCallbacks,
): IslandController {
  const engine = new Engine(canvas, true, {
    antialias: true,
    preserveDrawingBuffer: false,
    stencil: true,
  });
  engine.setHardwareScalingLevel(Math.min(1.35, 1 / window.devicePixelRatio));
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString("#b8d4cf00");
  scene.ambientColor = Color3.FromHexString("#51685f");
  scene.skipPointerMovePicking = true;

  const camera = new ArcRotateCamera(
    "follow-camera",
    -Math.PI / 4,
    0.95,
    20,
    new Vector3(startPosition.x, 1.6, startPosition.z),
    scene,
  );
  camera.fov = 0.72;
  camera.lowerRadiusLimit = 15;
  camera.upperRadiusLimit = 24;
  camera.lowerBetaLimit = 0.72;
  camera.upperBetaLimit = 1.18;
  camera.attachControl(canvas, true);
  camera.inputs.attached.keyboard?.detachControl();
  camera.panningSensibility = 0;
  camera.wheelPrecision = 80;

  const hemi = new HemisphericLight("sky-light", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.88;
  hemi.groundColor = Color3.FromHexString("#435a56");
  const sun = new DirectionalLight(
    "sun",
    new Vector3(-0.65, -1, 0.45),
    scene,
  );
  sun.position.set(16, 24, -12);
  sun.intensity = 1.25;
  const shadows = new ShadowGenerator(1024, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 18;
  shadows.bias = 0.0008;

  const mats = {
    grass: makeMaterial(scene, "grass", palette.grass),
    wood: makeMaterial(scene, "wood", palette.wood),
    leaf: makeMaterial(scene, "leaf", palette.leaf),
    leafLight: makeMaterial(scene, "leaf-light", palette.leafLight),
    stone: makeMaterial(scene, "stone", palette.stone),
    berry: makeMaterial(scene, "berry", "#a8473e"),
    herb: makeMaterial(scene, "herb", "#77945f"),
    shell: makeMaterial(scene, "shell", "#d5a589"),
    glow: makeMaterial(scene, "glow", "#efc160", "#9b5d1b"),
    cream: makeMaterial(scene, "cream", palette.cream),
    roof: makeMaterial(scene, "roof", "#6a4937"),
  };

  createIslandBase(scene);
  createHouse(scene, new Vector3(0, 0.42, 8.7), 0, mats.cream, mats.wood, mats.roof, "mira");
  createHouse(scene, new Vector3(-10.5, 0.42, 5.4), 0.55, mats.cream, mats.wood, mats.roof, "nolla");
  createHouse(scene, new Vector3(10.5, 0.42, 3.9), -0.55, mats.cream, mats.wood, mats.roof, "kai");
  createHouse(scene, new Vector3(5.8, 0.42, -7.8), 2.55, mats.cream, mats.wood, mats.roof, "sera");

  const treePositions = [
    [-13, -4],
    [-11, -7],
    [-7, -8.8],
    [-4, -9.4],
    [10.8, -5.8],
    [13.2, -2.5],
    [-14, 1],
    [14.5, 2],
    [-7.7, 7.6],
  ];
  const rockPositions = [
    [-5.3, 4.5],
    [8, 7],
    [11.4, -0.8],
    [-3, -7.2],
  ];
  const berryPositions = [
    [-7.5, 1.6],
    [5, 4.9],
    [7.5, -4.2],
  ];
  const herbPositions = [
    [-1.8, 3.2],
    [3.6, -2],
    [1.8, -7.2],
  ];
  const shellPositions = [
    [-13.6, 6.6],
    [13.8, 6.2],
    [9.4, 9],
  ];
  const glowPositions = [
    [-10.2, -4.2],
    [-5.4, -5.7],
    [8.5, -6.3],
  ];
  const reedPositions = [
    [-10.7, -2],
    [-6.4, -4.2],
  ];

  const interactables: Interactable[] = [];
  treePositions.forEach(([x, z], index) => {
    const node = createTree(scene, new Vector3(x, 0.42, z), mats, index);
    interactables.push({
      node,
      kind: "resource",
      item: "wood",
      label: ITEMS.wood.name,
      radius: 2.2,
      available: true,
      respawnAt: 0,
    });
  });
  rockPositions.forEach(([x, z], index) => {
    const node = createRockCluster(scene, new Vector3(x, 0.42, z), mats.stone, index);
    interactables.push({
      node,
      kind: "resource",
      item: "stone",
      label: ITEMS.stone.name,
      radius: 2,
      available: true,
      respawnAt: 0,
    });
  });
  berryPositions.forEach(([x, z], index) => {
    const node = createBush(scene, new Vector3(x, 0.42, z), mats.leaf, mats.berry, index);
    interactables.push({
      node,
      kind: "resource",
      item: "berry",
      label: ITEMS.berry.name,
      radius: 1.8,
      available: true,
      respawnAt: 0,
    });
  });
  herbPositions.forEach(([x, z], index) => {
    const node = createSmallPatch(scene, new Vector3(x, 0.42, z), mats.herb, "herb-patch", index);
    interactables.push({
      node,
      kind: "resource",
      item: "herb",
      label: ITEMS.herb.name,
      radius: 1.6,
      available: true,
      respawnAt: 0,
    });
  });
  shellPositions.forEach(([x, z], index) => {
    const node = createShellPatch(scene, new Vector3(x, 0.42, z), mats.shell, index);
    interactables.push({
      node,
      kind: "resource",
      item: "shell",
      label: ITEMS.shell.name,
      radius: 1.6,
      available: true,
      respawnAt: 0,
    });
  });
  glowPositions.forEach(([x, z], index) => {
    const node = createSmallPatch(scene, new Vector3(x, 0.42, z), mats.glow, "glowcap-patch", index, true);
    interactables.push({
      node,
      kind: "resource",
      item: "glowcap",
      label: ITEMS.glowcap.name,
      radius: 1.6,
      available: true,
      respawnAt: 0,
    });
  });
  reedPositions.forEach(([x, z], index) => {
    const node = createSmallPatch(scene, new Vector3(x, 0.42, z), mats.leafLight, "reed-patch", index);
    interactables.push({
      node,
      kind: "resource",
      item: "reed",
      label: ITEMS.reed.name,
      radius: 1.7,
      available: true,
      respawnAt: 0,
    });
  });

  const fishingMarker = new TransformNode("fishing-spot", scene);
  fishingMarker.position.set(-8, 0.42, 1.2);
  const ripple = setMaterial(
    MeshBuilder.CreateTorus(
      "fishing-ripple",
      { diameter: 1.3, thickness: 0.055, tessellation: 36 },
      scene,
    ),
    mats.shell,
  );
  ripple.parent = fishingMarker;
  ripple.position.y = 0.08;
  ripple.scaling.z = 0.65;
  interactables.push({
    node: fishingMarker,
    kind: "resource",
    item: "fish",
    label: ITEMS.fish.name,
    radius: 2.2,
    available: true,
    respawnAt: 0,
  });

  const player = createCharacter(
    scene,
    CHARACTERS[0],
    new Vector3(startPosition.x, 0.44, startPosition.z),
    0.78,
  );
  player.root.getChildMeshes().forEach((mesh) => shadows.addShadowCaster(mesh));

  const npcData = [
    { palette: CHARACTERS[1], position: new Vector3(-8.7, 0.44, 4.4), resident: "ノラ" as const },
    { palette: CHARACTERS[2], position: new Vector3(8.8, 0.44, 3.2), resident: "カイ" as const },
    { palette: CHARACTERS[3], position: new Vector3(4.8, 0.44, -5.6), resident: "セラ" as const },
  ];
  const npcs = npcData.map((npc, index) => {
    const rig = createCharacter(scene, npc.palette, npc.position, 0.76);
    rig.root.rotation.y = (index - 1) * 0.7;
    rig.root.getChildMeshes().forEach((mesh) => shadows.addShadowCaster(mesh));
    interactables.push({
      node: rig.root,
      kind: "resident",
      resident: npc.resident,
      label: npc.resident,
      radius: 2.2,
      available: true,
      respawnAt: 0,
    });
    return {
      rig,
      home: npc.position.clone(),
      phase: index * 2.1,
      resident: npc.resident,
    };
  });

  const glow = new GlowLayer("island-glow", scene, { blurKernelSize: 22 });
  glow.intensity = 0.42;
  glow.referenceMeshToUseItsOwnMaterial(ripple);

  const keys = new Set<string>();
  let paused = false;
  let closest: Interactable | null = null;
  let elapsed = 0;
  let lastFpsUpdate = 0;
  let lastPositionUpdate = 0;
  let currentDayMinute = 8 * 60;
  let footstepTimer = 0;
  const velocity = new Vector3();
  const furnitureMeshes = new Map<string, TransformNode>();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") event.preventDefault();
    keys.add(event.code);
    if ((event.code === "KeyE" || event.code === "Space") && !paused) {
      interact();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const burst = (position: Vector3, color: string) => {
    const mat = makeMaterial(scene, `burst-${performance.now()}`, color, color);
    const particles: Mesh[] = [];
    for (let index = 0; index < 7; index += 1) {
      const particle = setMaterial(
        MeshBuilder.CreateIcoSphere(
          `pickup-burst-${index}`,
          { radius: 0.08, subdivisions: 1 },
          scene,
        ),
        mat,
      );
      particle.position = position.clone();
      particle.metadata = {
        velocity: new Vector3(
          Math.cos(index * 0.9) * 0.04,
          0.055 + (index % 3) * 0.012,
          Math.sin(index * 0.9) * 0.04,
        ),
        life: 1,
      };
      particles.push(particle);
    }
    const observer = scene.onBeforeRenderObservable.add(() => {
      const delta = engine.getDeltaTime() / 1000;
      particles.forEach((particle) => {
        particle.position.addInPlace(
          (particle.metadata.velocity as Vector3).scale(delta * 60),
        );
        particle.metadata.life -= delta * 2.1;
        particle.scaling.setAll(Math.max(0.01, particle.metadata.life));
      });
      if (particles.every((particle) => particle.metadata.life <= 0)) {
        particles.forEach((particle) => particle.dispose());
        scene.onBeforeRenderObservable.remove(observer);
      }
    });
  };

  const interact = () => {
    if (!closest || !closest.available) return;
    if (closest.kind === "resident" && closest.resident) {
      callbacks.onTalk(closest.resident);
      const npc = npcs.find((entry) => entry.resident === closest?.resident);
      npc?.rig.setAnimation("talk", elapsed);
      return;
    }
    if (!closest.item) return;
    closest.available = false;
    closest.respawnAt = performance.now() + 26000;
    closest.node.setEnabled(false);
    player.setAnimation("pickup", elapsed);
    burst(closest.node.position.add(new Vector3(0, 0.8, 0)), ITEMS[closest.item].color);
    callbacks.onGather(closest.item);
    closest = null;
    callbacks.onHint(null);
  };

  const syncFurniture = (placed: PlacedFurniture[]) => {
    const desired = new Set(placed.map((item) => item.id));
    furnitureMeshes.forEach((node, id) => {
      if (!desired.has(id)) {
        node.dispose(false, true);
        furnitureMeshes.delete(id);
      }
    });
    placed.forEach((item) => {
      if (!furnitureMeshes.has(item.id)) {
        furnitureMeshes.set(item.id, createFurnitureMesh(scene, item, mats));
      }
    });
  };
  syncFurniture(initialFurniture);

  const setDayMinute = (minute: number) => {
    currentDayMinute = minute;
  };

  scene.onBeforeRenderObservable.add(() => {
    const delta = Math.min(0.05, engine.getDeltaTime() / 1000);
    elapsed += delta;
    if (paused) {
      player.setAnimation("idle", elapsed);
      return;
    }

    const horizontal =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const vertical =
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    const input = new Vector3(horizontal, 0, vertical);
    const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const targetSpeed = running ? 6.2 : 3.8;
    if (input.lengthSquared() > 0) {
      input.normalize();
      const targetVelocity = input.scale(targetSpeed);
      velocity.x += (targetVelocity.x - velocity.x) * Math.min(1, delta * 8);
      velocity.z += (targetVelocity.z - velocity.z) * Math.min(1, delta * 8);
      const targetRotation = Math.atan2(input.x, input.z);
      let rotationDelta = targetRotation - player.root.rotation.y;
      rotationDelta = Math.atan2(Math.sin(rotationDelta), Math.cos(rotationDelta));
      player.root.rotation.y += rotationDelta * Math.min(1, delta * 10);
      player.setAnimation(running ? "run" : "walk", elapsed);
      footstepTimer -= delta;
      if (footstepTimer <= 0) {
        footstepTimer = running ? 0.24 : 0.36;
      }
    } else {
      velocity.scaleInPlace(Math.max(0, 1 - delta * 8));
      player.setAnimation("idle", elapsed);
    }

    player.root.position.addInPlace(velocity.scale(delta));
    const normalized =
      (player.root.position.x * player.root.position.x) / (18.1 * 18.1) +
      (player.root.position.z * player.root.position.z) / (13.2 * 13.2);
    if (normalized > 1) {
      const correction = 1 / Math.sqrt(normalized);
      player.root.position.x *= correction;
      player.root.position.z *= correction;
      velocity.scaleInPlace(0.2);
    }
    player.root.position.y = 0.44;

    camera.target = Vector3.Lerp(
      camera.target,
      player.root.position.add(new Vector3(0, 1.6, 0)),
      Math.min(1, delta * 5),
    );

    let nextClosest: Interactable | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    const now = performance.now();
    for (const target of interactables) {
      if (!target.available && target.respawnAt && now >= target.respawnAt) {
        target.available = true;
        target.respawnAt = 0;
        target.node.setEnabled(true);
      }
      if (!target.available) continue;
      const distance = Vector3.Distance(
        player.root.position,
        target.node.getAbsolutePosition(),
      );
      if (distance < target.radius && distance < closestDistance) {
        nextClosest = target;
        closestDistance = distance;
      }
    }
    if (nextClosest !== closest) {
      closest = nextClosest;
      callbacks.onHint(
        closest
          ? {
              label: closest.label,
              action: closest.kind === "resident" ? "はなす" : "あつめる",
            }
          : null,
      );
    }

    npcs.forEach((npc, index) => {
      const radius = 0.75 + index * 0.15;
      const target = npc.home.add(
        new Vector3(
          Math.sin(elapsed * 0.18 + npc.phase) * radius,
          0,
          Math.cos(elapsed * 0.16 + npc.phase) * radius,
        ),
      );
      const direction = target.subtract(npc.rig.root.position);
      direction.y = 0;
      if (direction.lengthSquared() > 0.05) {
        direction.normalize();
        npc.rig.root.position.addInPlace(direction.scale(delta * 0.35));
        npc.rig.root.rotation.y = Math.atan2(direction.x, direction.z);
        npc.rig.setAnimation("walk", elapsed, 0.38);
      } else {
        npc.rig.setAnimation("idle", elapsed);
      }
      npc.rig.root.position.y = 0.44;
    });

    const hour = currentDayMinute / 60;
    const daylight = Math.max(0.18, Math.sin(((hour - 5) / 14) * Math.PI));
    const evening = hour >= 16.5 || hour < 6;
    hemi.intensity = 0.25 + daylight * 0.72;
    sun.intensity = 0.3 + daylight * 1.05;
    sun.diffuse = evening
      ? Color3.FromHexString("#e49a67")
      : Color3.FromHexString("#fff2d0");
    glow.intensity = evening ? 0.75 : 0.26;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = evening
      ? Color3.FromHexString("#294b50")
      : Color3.FromHexString("#a9d0c6");

    lastPositionUpdate += delta;
    if (lastPositionUpdate >= 0.5) {
      lastPositionUpdate = 0;
      callbacks.onPlayerMove({
        x: Number(player.root.position.x.toFixed(2)),
        z: Number(player.root.position.z.toFixed(2)),
      });
    }
    lastFpsUpdate += delta;
    if (lastFpsUpdate >= 1) {
      lastFpsUpdate = 0;
      callbacks.onFps(Math.round(engine.getFps()));
    }
    ripple.rotation.y += delta * 0.3;
    const pulse = 1 + Math.sin(elapsed * 2) * 0.07;
    ripple.scaling.x = pulse;
    ripple.scaling.z = 0.65 * pulse;
  });

  engine.runRenderLoop(() => scene.render());
  const resize = () => engine.resize();
  window.addEventListener("resize", resize);

  return {
    scene,
    setPaused: (value) => {
      paused = value;
      if (value) keys.clear();
    },
    setDayMinute,
    syncFurniture,
    dispose: () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      scene.dispose();
      engine.dispose();
    },
  };
}

export interface ShowcaseController {
  scene: Scene;
  selectCharacter: (index: number) => void;
  setAnimation: (animation: AnimationName) => void;
  setTime: (time: "day" | "night") => void;
  dispose: () => void;
}

export function createShowcaseScene(
  canvas: HTMLCanvasElement,
  onFps: (fps: number) => void,
): ShowcaseController {
  const engine = new Engine(canvas, true, { antialias: true });
  engine.setHardwareScalingLevel(Math.min(1.3, 1 / window.devicePixelRatio));
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString("#dfd5bd00");
  const camera = new ArcRotateCamera(
    "showcase-camera",
    -Math.PI / 2,
    1.38,
    7.7,
    new Vector3(0, 1.8, 0),
    scene,
  );
  camera.lowerRadiusLimit = 5.5;
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

  const rigs = CHARACTERS.map((character, index) => {
    const rig = createCharacter(scene, character, new Vector3(0, 0, 0), 0.93);
    rig.root.rotation.y = Math.PI;
    rig.root.setEnabled(index === 0);
    return rig;
  });
  let selected = 0;
  let animation: AnimationName = "idle";
  let elapsed = 0;
  let lastFps = 0;

  engine.runRenderLoop(() => {
    const delta = Math.min(0.05, engine.getDeltaTime() / 1000);
    elapsed += delta;
    rigs[selected].setAnimation(animation, elapsed);
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
      rigs[selected].root.setEnabled(false);
      selected = index;
      rigs[selected].root.setEnabled(true);
    },
    setAnimation: (next) => {
      animation = next;
    },
    setTime: (time) => {
      if (time === "day") {
        hemi.intensity = 0.92;
        key.intensity = 1.4;
        scene.clearColor = Color4.FromHexString("#dfd5bd00");
      } else {
        hemi.intensity = 0.35;
        key.intensity = 0.6;
        key.diffuse = Color3.FromHexString("#8fb0bd");
        scene.clearColor = Color4.FromHexString("#203a4200");
      }
    },
    dispose: () => {
      window.removeEventListener("resize", resize);
      rigs.forEach((rig) => rig.dispose());
      scene.dispose();
      engine.dispose();
    },
  };
}
