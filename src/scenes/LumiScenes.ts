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
import {
  CHARACTER_ORDER,
  getCharacterConfig,
  type CharacterId,
} from "@/src/characters/CharacterConfig";
import { CharacterController } from "@/src/characters/CharacterController";
import { createCharacterView } from "@/src/characters/CharacterView";
import type {
  CharacterLoadStatus,
  CharacterMetrics,
} from "@/src/characters/CharacterView";
import { ITEMS } from "@/src/data/gameData";
import { cameraRelativeMovement } from "@/src/world/CameraRelativeMovement";
import {
  resolveWorldMovement,
  resolveNpcMovement,
  STATIC_WORLD_COLLIDERS,
  type WorldCollider,
} from "@/src/world/CollisionWorld";
import {
  HOUSE_LAYOUT,
  POND_LAYOUT,
  ROCK_LAYOUT,
  TREE_LAYOUT,
} from "@/src/world/IslandLayout";
import type { ActivityRequest } from "@/src/ui/minigames/ActivityOverlay";
import {
  rotatedFootprint,
  validateFurniturePlacement,
} from "@/src/placement/PlacementValidator";
import type {
  PlacementMode,
  PlacementPreview,
} from "@/src/placement/PlacementController";
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
  onActivity: (activity: ActivityRequest) => void;
  onTalk: (resident: "ノラ" | "カイ" | "セラ") => void;
  onEditFurniture: (id: string) => void;
  onPlacementPreview: (preview: PlacementPreview | null) => void;
  onPlacementConfirm: (preview: PlacementPreview) => void;
  onPlacementRotate: () => void;
  onPlacementRemove: (id: string) => void;
  onPlayerMove: (position: { x: number; z: number }) => void;
  onFps: (fps: number) => void;
}

export interface IslandController {
  scene: Scene;
  setPaused: (paused: boolean) => void;
  setDayMinute: (minute: number) => void;
  syncFurniture: (placed: PlacedFurniture[]) => void;
  setPlacementMode: (mode: PlacementMode | null) => void;
  resetCamera: () => void;
  dispose: () => void;
}

interface Interactable {
  node: TransformNode;
  kind: "resource" | "resident" | "furniture";
  item?: ResourceId;
  resident?: "ノラ" | "カイ" | "セラ";
  furnitureId?: string;
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
  pond.position.set(POND_LAYOUT.position.x, 0.43, POND_LAYOUT.position.z);
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
      POND_LAYOUT.position.x + Math.cos(angle) * 3.32,
      0.46,
      POND_LAYOUT.position.z + Math.sin(angle) * 2.34,
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
  const occluderNodes: TransformNode[] = HOUSE_LAYOUT.map((house) =>
    createHouse(
      scene,
      new Vector3(house.position.x, house.position.y, house.position.z),
      house.rotation,
      mats.cream,
      mats.wood,
      mats.roof,
      house.id.replace("house-", ""),
    ),
  );
  const ghostValid = makeMaterial(scene, "placement-valid", "#65b875", "#173c25");
  const ghostInvalid = makeMaterial(scene, "placement-invalid", "#d65d51", "#501511");
  ghostValid.alpha = 0.58;
  ghostInvalid.alpha = 0.62;

  const treePositions = TREE_LAYOUT.map(
    (tree) => [tree.position.x, tree.position.z] as const,
  );
  const rockPositions = ROCK_LAYOUT.map(
    (rock) => [rock.position.x, rock.position.z] as const,
  );
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
    occluderNodes.push(node);
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

  const player = createCharacterView(
    scene,
    getCharacterConfig("mira"),
    new Vector3(startPosition.x, 0.44, startPosition.z),
    0.78,
    shadows,
  );
  player.root.rotation.y = Math.PI;
  const playerMotion = new CharacterController();
  playerMotion.setFacing(Math.PI);

  const npcData = [
    { id: "nolla" as const, position: new Vector3(-8.7, 0.44, 4.4), resident: "ノラ" as const },
    { id: "kai" as const, position: new Vector3(8.8, 0.44, 3.2), resident: "カイ" as const },
    { id: "sera" as const, position: new Vector3(4.8, 0.44, -5.6), resident: "セラ" as const },
  ];
  const npcs = npcData.map((npc, index) => {
    const rig = createCharacterView(
      scene,
      getCharacterConfig(npc.id),
      npc.position,
      0.76,
      shadows,
    );
    rig.root.rotation.y = (index - 1) * 0.7;
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
      actionUntil: 0,
    };
  });

  const glow = new GlowLayer("island-glow", scene, { blurKernelSize: 22 });
  glow.intensity = 0.42;
  glow.referenceMeshToUseItsOwnMaterial(ripple);

  const keys = new Set<string>();
  let paused = false;
  let closest: Interactable | null = null;
  let realElapsedTime = 0;
  let gameElapsedTime = 0;
  let animationElapsedTime = 0;
  let playerAction: AnimationName | null = null;
  let playerActionUntil = 0;
  let lastFpsUpdate = 0;
  let lastPositionUpdate = 0;
  let currentDayMinute = 8 * 60;
  let footstepTimer = 0;
  const furnitureMeshes = new Map<string, TransformNode>();
  const furnitureTargets = new Map<string, Interactable>();
  let currentFurniture = [...initialFurniture];
  let placementMode: PlacementMode | null = null;
  let placementPreview: PlacementPreview | null = null;
  let placementGhost: TransformNode | null = null;

  const resetCamera = () => {
    camera.alpha = -Math.PI / 4;
    camera.beta = 0.95;
    camera.radius = 20;
  };

  const clearPlacementGhost = () => {
    placementGhost?.dispose(false, true);
    placementGhost = null;
    placementPreview = null;
    callbacks.onPlacementPreview(null);
    furnitureMeshes.forEach((node) => node.setEnabled(true));
  };

  const setPlacementMode = (mode: PlacementMode | null) => {
    clearPlacementGhost();
    placementMode = mode;
    if (!mode) return;
    const ghostPlaced: PlacedFurniture = {
      id: "placement-preview",
      type: mode.type,
      position: { x: player.root.position.x, z: player.root.position.z },
      rotation: mode.rotation,
    };
    placementGhost = createFurnitureMesh(scene, ghostPlaced, mats);
    placementGhost.getChildMeshes().forEach((mesh) => {
      mesh.material = ghostInvalid;
      mesh.isPickable = false;
    });
    if (mode.editingId) {
      furnitureMeshes.get(mode.editingId)?.setEnabled(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") event.preventDefault();
    if (event.code === "Home") {
      resetCamera();
      return;
    }
    if (placementMode && event.code === "KeyR") {
      callbacks.onPlacementRotate();
      return;
    }
    if (placementMode && event.code === "KeyX" && placementMode.editingId) {
      callbacks.onPlacementRemove(placementMode.editingId);
      return;
    }
    keys.add(event.code);
    if ((event.code === "KeyE" || event.code === "Space") && !paused) {
      if (placementMode && placementPreview?.valid) {
        callbacks.onPlacementConfirm(placementPreview);
      } else if (!placementMode) {
        interact();
      }
    }
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
  const onBlur = () => keys.clear();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  const burstMaterialCache = new Map<string, StandardMaterial>();
  const burst = (position: Vector3, color: string) => {
    let mat = burstMaterialCache.get(color);
    if (!mat) {
      mat = makeMaterial(scene, `burst-${burstMaterialCache.size}`, color, color);
      burstMaterialCache.set(color, mat);
    }
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

  const reactToGatherTarget = (target: Interactable) => {
    const original = target.node.scaling.clone();
    const isSolid = target.item === "wood" || target.item === "stone";
    target.node.scaling.y = original.y * (isSolid ? 0.9 : 1.12);
    target.node.rotation.z += target.item === "stone" ? 0.025 : -0.045;
    let elapsed = 0;
    const observer = scene.onBeforeRenderObservable.add(() => {
      elapsed += Math.min(0.05, engine.getDeltaTime() / 1000);
      const amount = Math.min(1, elapsed / 0.72);
      target.node.scaling = Vector3.Lerp(target.node.scaling, original, amount);
      if (amount >= 1) {
        target.node.scaling.copyFrom(original);
        target.node.rotation.z = 0;
        scene.onBeforeRenderObservable.remove(observer);
      }
    });
  };

  const interact = () => {
    if (!closest || !closest.available) return;
    if (closest.kind === "furniture" && closest.furnitureId) {
      callbacks.onEditFurniture(closest.furnitureId);
      return;
    }
    if (closest.kind === "resident" && closest.resident) {
      callbacks.onTalk(closest.resident);
      const npc = npcs.find((entry) => entry.resident === closest?.resident);
      if (npc) {
        npc.actionUntil = gameElapsedTime + 2.2;
        npc.rig.setAnimation("talk", 1, true);
      }
      return;
    }
    if (!closest.item) return;
    playerAction = "pickup";
    playerActionUntil = gameElapsedTime + 1.05;
    playerMotion.setInteraction("pickup");
    player.setAnimation("pickup", 1, true);
    reactToGatherTarget(closest);
    burst(closest.node.position.add(new Vector3(0, 0.8, 0)), ITEMS[closest.item].color);
    callbacks.onActivity({
      kind:
        closest.item === "wood"
          ? "wood"
          : closest.item === "stone"
            ? "stone"
            : closest.item === "fish"
              ? "fishing"
              : "forage",
      item: closest.item,
      sourceId: closest.node.name,
    });
    closest = null;
    callbacks.onHint(null);
  };

  const syncFurniture = (placed: PlacedFurniture[]) => {
    currentFurniture = [...placed];
    const desired = new Set(placed.map((item) => item.id));
    furnitureMeshes.forEach((node, id) => {
      if (!desired.has(id)) {
        node.dispose(false, true);
        furnitureMeshes.delete(id);
        furnitureTargets.delete(id);
      }
    });
    placed.forEach((item) => {
      let node = furnitureMeshes.get(item.id);
      if (!node) {
        node = createFurnitureMesh(scene, item, mats);
        furnitureMeshes.set(item.id, node);
        furnitureTargets.set(item.id, {
          node,
          kind: "furniture",
          furnitureId: item.id,
          label: ITEMS[item.type].name,
          radius: 2.25,
          available: true,
          respawnAt: 0,
        });
      }
      node.position.set(item.position.x, 0.45, item.position.z);
      node.rotation.y = item.rotation;
      node.setEnabled(placementMode?.editingId !== item.id);
    });
  };
  syncFurniture(initialFurniture);

  const setDayMinute = (minute: number) => {
    currentDayMinute = minute;
  };

  scene.onBeforeRenderObservable.add(() => {
    const delta = Math.min(0.05, engine.getDeltaTime() / 1000);
    realElapsedTime += delta;
    scene.metadata = {
      ...(scene.metadata ?? {}),
      phase2Timing: { realElapsedTime, gameElapsedTime, animationElapsedTime },
    };
    if (paused) {
      playerMotion.stop();
      return;
    }
    gameElapsedTime += delta;
    animationElapsedTime += delta;
    if (playerAction && gameElapsedTime >= playerActionUntil) {
      playerAction = null;
      playerMotion.setInteraction(null);
    }

    const horizontal =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const forwardAmount =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const cameraForward = camera.target.subtract(camera.position);
    cameraForward.y = 0;
    const movement = cameraRelativeMovement(horizontal, forwardAmount, {
      x: cameraForward.x,
      z: cameraForward.z,
    });
    const input = new Vector3(movement.x, 0, movement.z);
    const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const motion = playerMotion.update(
      { x: input.x, z: input.z },
      running,
      delta,
    );
    player.root.rotation.y = motion.facing;
    player.setAnimation(motion.animation, running ? 1.08 : 1);
    player.update(delta);
    if (input.lengthSquared() > 0) {
      footstepTimer -= delta;
      if (footstepTimer <= 0) {
        footstepTimer = running ? 0.24 : 0.36;
      }
    }

    const currentPosition = {
      x: player.root.position.x,
      z: player.root.position.z,
    };
    const desiredPosition = {
      x: currentPosition.x + motion.velocity.x * delta,
      z: currentPosition.z + motion.velocity.z * delta,
    };
    const dynamicColliders: WorldCollider[] = [
      ...STATIC_WORLD_COLLIDERS,
      ...npcs.map((npc, index) => ({
        kind: "circle" as const,
        id: `npc-${index}`,
        x: npc.rig.root.position.x,
        z: npc.rig.root.position.z,
        radius: 0.52,
      })),
      ...currentFurniture
        .filter((item) => item.id !== placementMode?.editingId)
        .map((item) => {
          const footprint = rotatedFootprint(item.type, item.rotation);
          return {
            kind: "box" as const,
            id: `furniture-${item.id}`,
            x: item.position.x,
            z: item.position.z,
            halfWidth: footprint.halfWidth,
            halfDepth: footprint.halfDepth,
            rotation: item.rotation,
          };
        }),
    ];
    const resolvedPosition = resolveWorldMovement(
      currentPosition,
      desiredPosition,
      0.48,
      dynamicColliders,
    );
    player.root.position.x = resolvedPosition.x;
    player.root.position.z = resolvedPosition.z;
    if (
      Math.hypot(
        resolvedPosition.x - desiredPosition.x,
        resolvedPosition.z - desiredPosition.z,
      ) > 0.04
    ) {
      playerMotion.stop();
    }
    player.root.position.y = 0.44;

    camera.target = Vector3.Lerp(
      camera.target,
      player.root.position.add(new Vector3(0, 1.6, 0)),
      Math.min(1, delta * 5),
    );

    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;
    const playerX = player.root.position.x;
    const playerZ = player.root.position.z;
    const segmentX = playerX - cameraX;
    const segmentZ = playerZ - cameraZ;
    const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
    occluderNodes.forEach((node) => {
      const nodePosition = node.getAbsolutePosition();
      const projection =
        segmentLengthSquared > 0.0001
          ? ((nodePosition.x - cameraX) * segmentX +
              (nodePosition.z - cameraZ) * segmentZ) /
            segmentLengthSquared
          : 0;
      const closestX = cameraX + segmentX * projection;
      const closestZ = cameraZ + segmentZ * projection;
      const distanceToViewLine = Math.hypot(
        nodePosition.x - closestX,
        nodePosition.z - closestZ,
      );
      const shouldFade =
        projection > 0.08 &&
        projection < 0.92 &&
        distanceToViewLine < 1.45 &&
        Math.hypot(nodePosition.x - playerX, nodePosition.z - playerZ) > 1.2;
      const targetVisibility = shouldFade ? 0.28 : 1;
      node.getChildMeshes().forEach((mesh) => {
        mesh.visibility +=
          (targetVisibility - mesh.visibility) * Math.min(1, delta * 8);
      });
    });

    if (placementMode && placementGhost) {
      const footprint = rotatedFootprint(
        placementMode.type,
        placementMode.rotation,
      );
      const previewDistance =
        Math.hypot(footprint.halfWidth, footprint.halfDepth) + 1.15;
      const previewPosition = {
        x:
          Math.round(
            (player.root.position.x +
              Math.sin(player.root.rotation.y) * previewDistance) *
              4,
          ) / 4,
        z:
          Math.round(
            (player.root.position.z +
              Math.cos(player.root.rotation.y) * previewDistance) *
              4,
          ) / 4,
      };
      const validation = validateFurniturePlacement(
        {
          type: placementMode.type,
          position: previewPosition,
          rotation: placementMode.rotation,
          editingId: placementMode.editingId,
        },
        {
          placedFurniture: currentFurniture,
          playerPosition: {
            x: player.root.position.x,
            z: player.root.position.z,
          },
          npcPositions: npcs.map((npc) => ({
            x: npc.rig.root.position.x,
            z: npc.rig.root.position.z,
          })),
        },
      );
      const nextPreview: PlacementPreview = {
        ...validation,
        position: previewPosition,
        rotation: placementMode.rotation,
      };
      placementGhost.position.set(previewPosition.x, 0.45, previewPosition.z);
      placementGhost.rotation.y = placementMode.rotation;
      placementGhost.getChildMeshes().forEach((mesh) => {
        mesh.material = validation.valid ? ghostValid : ghostInvalid;
      });
      if (
        !placementPreview ||
        placementPreview.position.x !== nextPreview.position.x ||
        placementPreview.position.z !== nextPreview.position.z ||
        placementPreview.rotation !== nextPreview.rotation ||
        placementPreview.valid !== nextPreview.valid ||
        placementPreview.reason !== nextPreview.reason
      ) {
        placementPreview = nextPreview;
        callbacks.onPlacementPreview(nextPreview);
      }
    }

    let nextClosest: Interactable | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    const nearbyTargets = placementMode
      ? []
      : [...interactables, ...furnitureTargets.values()];
    for (const target of nearbyTargets) {
      if (!target.available && target.respawnAt && gameElapsedTime >= target.respawnAt) {
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
              action:
                closest.kind === "resident"
                  ? "はなす"
                  : closest.kind === "furniture"
                    ? "ならべかえる"
                    : closest.item === "fish"
                      ? "つりをする"
                      : closest.item === "wood"
                        ? "えだを集める"
                        : closest.item === "stone"
                          ? "石をさがす"
                          : "そっとひろう",
            }
          : null,
      );
    }

    npcs.forEach((npc, index) => {
      const radius = 0.75 + index * 0.15;
      const target = npc.home.add(
        new Vector3(
          Math.sin(gameElapsedTime * 0.18 + npc.phase) * radius,
          0,
          Math.cos(gameElapsedTime * 0.16 + npc.phase) * radius,
        ),
      );
      const direction = target.subtract(npc.rig.root.position);
      direction.y = 0;
      if (direction.lengthSquared() > 0.05) {
        direction.normalize();
        const currentNpcPosition = { x: npc.rig.root.position.x, z: npc.rig.root.position.z };
        const desiredNpcPosition = {
          x: currentNpcPosition.x + direction.x * delta * 0.35,
          z: currentNpcPosition.z + direction.z * delta * 0.35,
        };
        const furnitureColliders: WorldCollider[] = currentFurniture.map((item) => {
          const footprint = rotatedFootprint(item.type, item.rotation);
          return {
            kind: "box",
            id: `npc-furniture-${item.id}`,
            x: item.position.x,
            z: item.position.z,
            halfWidth: footprint.halfWidth,
            halfDepth: footprint.halfDepth,
            rotation: item.rotation,
          };
        });
        const resolvedNpcPosition = resolveNpcMovement(
          currentNpcPosition,
          desiredNpcPosition,
          0.48,
          [...STATIC_WORLD_COLLIDERS, ...furnitureColliders],
          [
            {
              id: "player",
              x: player.root.position.x,
              z: player.root.position.z,
              radius: 0.48,
            },
            ...npcs
              .filter((other) => other !== npc)
              .map((other, otherIndex) => ({
                id: `other-npc-${otherIndex}`,
                x: other.rig.root.position.x,
                z: other.rig.root.position.z,
                radius: 0.48,
              })),
          ],
        );
        npc.rig.root.position.x = resolvedNpcPosition.x;
        npc.rig.root.position.z = resolvedNpcPosition.z;
        npc.rig.root.rotation.y = Math.atan2(direction.x, direction.z);
        npc.rig.setAnimation(
          gameElapsedTime < npc.actionUntil ? "talk" : "walk",
          gameElapsedTime < npc.actionUntil ? 1 : 0.82,
        );
      } else {
        npc.rig.setAnimation(
          gameElapsedTime < npc.actionUntil ? "talk" : "idle",
        );
      }
      npc.rig.update(delta);
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
    const pulse = 1 + Math.sin(animationElapsedTime * 2) * 0.07;
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
    setPlacementMode,
    resetCamera,
    dispose: () => {
      placementGhost?.dispose(false, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
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
