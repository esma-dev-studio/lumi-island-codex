import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Engine } from "@babylonjs/core/Engines/engine";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getCharacterConfig } from "@/src/characters/CharacterConfig";
import { CharacterController } from "@/src/characters/CharacterController";
import { createCharacterView } from "@/src/characters/CharacterView";
import { createVisiblePlayerAvatar } from "@/src/characters/VisiblePlayerAvatar";
import { ITEMS } from "@/src/data/gameData";
import { cameraRelativeMovement } from "@/src/world/CameraRelativeMovement";
import {
  THIRD_PERSON_CAMERA,
  thirdPersonCameraTarget,
} from "@/src/world/ThirdPersonCamera";
import {
  resolveWorldMovement,
  resolveNpcMovement,
  STATIC_WORLD_COLLIDERS,
  type WorldCollider,
} from "@/src/world/CollisionWorld";
import { HOUSE_LAYOUT, POND_LAYOUT } from "@/src/world/IslandLayout";
import {
  RESOURCE_WORLD_DEFINITIONS,
  resourceDefinitionById,
} from "@/src/resources/ResourceDefinitions";
import { nightGardenPresentation, resourceIsAvailableAtTime } from "@/src/world/NightGardenController";
import {
  INITIAL_WORLD_PROGRESSION,
  lockedAreaColliders,
  resourceIsUnlocked,
  type WorldProgressionSnapshot,
} from "@/src/world/UnlockableAreaController";
import { createResourceVisual } from "@/src/world/ResourceBuilder";
import {
  smoothVisibility,
  targetOccluderVisibility,
} from "@/src/world/OcclusionController";
import {
  createProgressionLandmarks,
  syncProgressionLandmarks,
} from "@/src/world/EnvironmentBuilder";
import type { ActivityRequest } from "@/src/ui/minigames/ActivityOverlayPhase21";
import {
  createWorldZones,
  stableWorldZoneAt,
  type WorldZoneDefinition,
} from "@/src/world/WorldZones";
import { createProductionEnvironmentAssets } from "@/src/world/ProductionEnvironmentAssets";
import { RESIDENT_WORLD_SPAWNS } from "@/src/world/ResidentSpawns";
import { createResidentMarker } from "@/src/world/ResidentMarker";
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
  ResidentId,
  ResourceId,
  ResourceState,
} from "@/src/game/types";
import type { ActivityResult } from "@/src/activities/ActivityResult";
import {
  activityDuration,
  animationForActivity,
} from "@/src/activities/ActivityCoordinator";
import { isResourceAvailable } from "@/src/resources/ResourceStateSystem";
import { ResourceVisualController } from "@/src/resources/ResourceVisualController";
import { playSound } from "@/src/audio/FileAudioSystem";
import { environmentDetailProfile } from "@/src/world/EnvironmentDetailController";
import { advanceFootstepCadence } from "@/src/audio/FootstepCadence";
import {
  FREE_PLAYER_ACTION,
  animatePlayerActivity,
  isPlayerMovementLocked,
  preparePlayerActivity,
  rewardPlayerActivity,
  type PlayerActionState,
} from "@/src/player/PlayerActionController";

export interface InteractionHint {
  sourceId: string;
  item?: ResourceId;
  resident?: ResidentId;
  label: string;
  action: string;
}

export interface TutorialGuideTarget {
  sourceId?: string;
  resident?: ResidentId;
}

export interface IslandSceneCallbacks {
  onHint: (hint: InteractionHint | null) => void;
  onActivity: (activity: ActivityRequest) => void;
  onActivitySettled: (result: ActivityResult) => void;
  onTalk: (resident: ResidentId) => void;
  onEditFurniture: (id: string) => void;
  onPlacementPreview: (preview: PlacementPreview | null) => void;
  onPlacementConfirm: (preview: PlacementPreview) => void;
  onPlacementRotate: () => void;
  onPlacementRemove: (id: string) => void;
  onPlayerMove: (position: { x: number; z: number }) => void;
  onFps: (fps: number) => void;
  onZoneChange: (zone: WorldZoneDefinition) => void;
}

export interface IslandController {
  scene: Scene;
  setPaused: (paused: boolean) => void;
  setDayMinute: (minute: number) => void;
  setProgression: (progression: WorldProgressionSnapshot) => void;
  syncFurniture: (placed: PlacedFurniture[]) => void;
  setPlacementMode: (mode: PlacementMode | null) => void;
  setTutorialGuide: (target: TutorialGuideTarget | null) => void;
  syncResourceStates: (states: Record<string, ResourceState>) => void;
  resolveActivity: (result: ActivityResult) => void;
  resetCamera: () => void;
  dispose: () => void;
}

interface Interactable {
  node: TransformNode;
  resourceId?: string;
  kind: "resource" | "resident" | "furniture";
  item?: ResourceId;
  resident?: ResidentId;
  furnitureId?: string;
  label: string;
  radius: number;
  available: boolean;
  progressionAvailable?: boolean;
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
      { height: 0.18, diameter: 112, tessellation: 96 },
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
      { height: 0.22, diameter: 70, tessellation: 96 },
      scene,
    ),
    shallowMat,
  );
  shallows.position.y = -0.56;
  shallows.scaling.z = 0.72;

  const sandMat = makeMaterial(scene, "island-sand", palette.sand);
  const sand = setMaterial(
    MeshBuilder.CreateCylinder(
      "island-sand",
      { height: 0.72, diameter: 62, tessellation: 96 },
      scene,
    ),
    sandMat,
  );
  sand.position.y = -0.35;
  sand.scaling.z = 0.72;

  const grassMat = makeMaterial(scene, "island-grass", palette.grass);
  const grass = setMaterial(
    MeshBuilder.CreateCylinder(
      "island-grass",
      { height: 0.75, diameter: 55, tessellation: 96 },
      scene,
    ),
    grassMat,
  );
  grass.position.y = 0;
  grass.scaling.z = 0.73;

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
  const deviceNavigator = window.navigator as Navigator & { deviceMemory?: number };
  const e2eMode =
    process.env.NODE_ENV !== "production" &&
    new URLSearchParams(window.location.search).has("e2e");
  const debugPositionInterval = e2eMode ? 0.12 : 0.5;
  const movementSimulationScale = e2eMode ? 3 : 1;
  const detail = environmentDetailProfile({
    hardwareConcurrency: deviceNavigator.hardwareConcurrency,
    deviceMemory: deviceNavigator.deviceMemory,
    devicePixelRatio: window.devicePixelRatio,
    prefersReducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  });
  const engine = new Engine(canvas, true, {
    antialias: true,
    preserveDrawingBuffer: false,
    stencil: true,
  });
  engine.setHardwareScalingLevel(detail.hardwareScalingLevel);
  canvas.dataset.detailLevel = detail.level;
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString("#b8d4cf00");
  scene.ambientColor = Color3.FromHexString("#51685f");
  scene.skipPointerMovePicking = true;
  let disposalStarted = false;

  const initialCameraTarget = thirdPersonCameraTarget({
    x: startPosition.x,
    y: 0.44,
    z: startPosition.z,
  });
  const camera = new ArcRotateCamera(
    "follow-camera",
    THIRD_PERSON_CAMERA.alpha,
    THIRD_PERSON_CAMERA.beta,
    THIRD_PERSON_CAMERA.radius,
    new Vector3(
      initialCameraTarget.x,
      initialCameraTarget.y,
      initialCameraTarget.z,
    ),
    scene,
  );
  camera.fov = THIRD_PERSON_CAMERA.fov;
  camera.lowerRadiusLimit = THIRD_PERSON_CAMERA.minimumRadius;
  camera.upperRadiusLimit = THIRD_PERSON_CAMERA.maximumRadius;
  camera.lowerBetaLimit = THIRD_PERSON_CAMERA.minimumBeta;
  camera.upperBetaLimit = THIRD_PERSON_CAMERA.maximumBeta;
  camera.attachControl(canvas, true);
  camera.inputs.attached.keyboard?.detachControl();
  camera.panningSensibility = 0;
  camera.wheelPrecision = 80;
  canvas.dataset.cameraMode = "third-person";

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
  const shadows = new ShadowGenerator(detail.shadowMapSize, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = detail.shadowBlurKernel;
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
  createWorldZones(scene);
  const productionEnvironment = createProductionEnvironmentAssets(scene, shadows);
  void productionEnvironment.ready.then(() => {
    if (disposalStarted) return;
    const report = scene.metadata?.productionEnvironment as
      | { loaded: number; requested: number }
      | undefined;
    if (report) {
      canvas.dataset.productionEnvironment = `${report.loaded}/${report.requested}`;
    }
  });
  const progressionLandmarks = createProgressionLandmarks(scene, mats);
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

  const interactables: Interactable[] = [];
  const fishingRipples: Mesh[] = [];
  RESOURCE_WORLD_DEFINITIONS
    .filter((definition) => definition.visualType !== "fishing-spot")
    .forEach((definition) => {
      const node = createResourceVisual(scene, definition, mats);
      if (definition.visualType === "cedar-tree") occluderNodes.push(node);
      interactables.push({
        node,
        resourceId: definition.id,
        kind: "resource",
        item: definition.item,
        label: ITEMS[definition.item].name,
        radius: definition.interactionRadius,
        available: !definition.unlockRequirement && !definition.timeWindow,
        progressionAvailable: !definition.unlockRequirement && !definition.timeWindow,
        respawnAt: 0,
      });
    });

  RESOURCE_WORLD_DEFINITIONS
    .filter((definition) => definition.visualType === "fishing-spot")
    .forEach((definition, index) => {
      const fishingMarker = new TransformNode(`fishing-spot-visual-${index}`, scene);
      fishingMarker.position.set(definition.position.x, 0.42, definition.position.z);
      const ripple = setMaterial(
        MeshBuilder.CreateTorus(
          `fishing-ripple-${index}`,
          { diameter: index === 0 ? 1.3 : 1.55, thickness: 0.055, tessellation: 36 },
          scene,
        ),
        index === 0 ? mats.shell : mats.glow,
      );
      ripple.parent = fishingMarker;
      ripple.position.y = 0.08;
      ripple.scaling.z = index === 0 ? 0.65 : 0.78;
      fishingRipples.push(ripple);
      interactables.push({
        node: fishingMarker,
        resourceId: definition.id,
        kind: "resource",
        item: definition.item,
        label: index === 0 ? "月の池の魚" : "海辺の魚",
        radius: definition.interactionRadius,
        available: !definition.unlockRequirement,
        progressionAvailable: !definition.unlockRequirement,
        respawnAt: 0,
      });
    });

  const resourceTargets = new Map<string, Interactable>();
  const resourceVisuals = new Map<string, ResourceVisualController>();
  interactables
    .filter(
      (target): target is Interactable & { item: ResourceId } =>
        target.kind === "resource" && Boolean(target.item),
    )
    .forEach((target) => {
      const resourceId = target.resourceId ?? target.node.name;
      resourceTargets.set(resourceId, target);
      resourceVisuals.set(
        resourceId,
        new ResourceVisualController(target.node, target.item),
      );
    });

  let currentResourceStates: Record<string, ResourceState> = {};
  const refreshResourceAvailability = () => {
    resourceTargets.forEach((target, sourceId) => {
      const definition = resourceDefinitionById(sourceId);
      const progressionAvailable = definition
        ? resourceIsUnlocked(definition, currentProgression) &&
          resourceIsAvailableAtTime(definition, currentDayMinute)
        : true;
      const stateAvailable = isResourceAvailable(currentResourceStates, sourceId);
      target.progressionAvailable = progressionAvailable;
      target.available = progressionAvailable && stateAvailable;
      resourceVisuals.get(sourceId)?.apply(currentResourceStates[sourceId]);
      if (!progressionAvailable) target.node.setEnabled(false);
    });
    if (closest && !closest.available) {
      closest = null;
      callbacks.onHint(null);
    }
  };

  const syncResourceStates = (states: Record<string, ResourceState>) => {
    currentResourceStates = states;
    refreshResourceAvailability();
    if (
      playerActionState.type === "activity" &&
      playerActionState.phase === "reward" &&
      states[playerActionState.sourceId]?.state !== "available"
    ) {
      playerActionState = FREE_PLAYER_ACTION;
      keys.clear();
    }
  };
  const playerConfig = getCharacterConfig("mira");
  const player = createCharacterView(
    scene,
    playerConfig,
    new Vector3(startPosition.x, 0.44, startPosition.z),
    0.78,
    shadows,
  );
  player.root.rotation.y = Math.PI;
  const visiblePlayerAvatar = createVisiblePlayerAvatar(
    scene,
    player.root.position,
    shadows,
  );
  visiblePlayerAvatar.sync(player.root.position, player.root.rotation.y);
  visiblePlayerAvatar.update("idle", 0);
  void player.ready.then((loaded) => {
    if (disposalStarted) return;
    if (!loaded) return;
    visiblePlayerAvatar.setEnabled(false);
    canvas.dataset.playerAvatar = "production-glb";
  });
  canvas.dataset.playerAvatar = "loading-production-glb";
  const playerMotion = new CharacterController();
  playerMotion.setFacing(Math.PI);
  const playerMarkerMaterial = makeMaterial(
    scene,
    "player-marker-material",
    "#f3c761",
    "#9c641e",
  );
  playerMarkerMaterial.alpha = 0.36;
  playerMarkerMaterial.disableLighting = true;
  const playerMarker = setMaterial(
    MeshBuilder.CreateTorus(
      "player-ground-marker",
      { diameter: 0.95, thickness: 0.04, tessellation: 40 },
      scene,
    ),
    playerMarkerMaterial,
  );
  playerMarker.position.set(player.root.position.x, 0.47, player.root.position.z);
  playerMarker.isPickable = false;

  const residentMarkerAccents: Record<ResidentId, string> = {
    ノラ: "#e3aa3f",
    カイ: "#58a8ba",
    セラ: "#82aa67",
  };
  const npcs = RESIDENT_WORLD_SPAWNS.map((npc, index) => {
    const config = getCharacterConfig(npc.id);
    const position = new Vector3(
      npc.position.x,
      npc.position.y,
      npc.position.z,
    );
    const rig = createCharacterView(
      scene,
      config,
      position,
      0.76,
      shadows,
    );
    rig.root.rotation.y = npc.facing;
    const fallbackAvatar = createVisiblePlayerAvatar(
      scene,
      position,
      shadows,
      npc.id === "nolla" ? "nolla" : "player",
    );
    fallbackAvatar.sync(rig.root.position, rig.root.rotation.y);
    fallbackAvatar.update("idle", 0);
    canvas.setAttribute(
      "data-resident-avatar-" + npc.id,
      "loading-with-visible-fallback",
    );
    void rig.ready.then((loaded) => {
      if (disposalStarted) return;
      fallbackAvatar.setEnabled(!loaded);
      canvas.setAttribute(
        "data-resident-avatar-" + npc.id,
        loaded ? "production-glb" : "visible-fallback",
      );
    });
    const marker = createResidentMarker(
      scene,
      npc.resident,
      residentMarkerAccents[npc.resident],
    );
    marker.sync(rig.root.position);
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
      fallbackAvatar,
      marker,
      home: position.clone(),
      phase: index * 2.1,
      resident: npc.resident,
      actionUntil: 0,
      collisionRadius: config.colliderSize.radius,
      wanderRadius: npc.wanderRadius,
    };
  });
  canvas.dataset.residentWayfinding =
    String(npcs.length) + "/" + String(RESIDENT_WORLD_SPAWNS.length);
  const pendingAssetLoads: Promise<unknown>[] = [
    productionEnvironment.ready,
    player.ready,
    ...npcs.map((npc) => npc.rig.ready),
  ];

  const glow = new GlowLayer("island-glow", scene, { blurKernelSize: 22 });
  glow.intensity = 0.42;
  glow.referenceMeshToUseItsOwnMaterial(playerMarker);
  fishingRipples.forEach((mesh) => glow.referenceMeshToUseItsOwnMaterial(mesh));
  const tutorialGuideMaterial = makeMaterial(
    scene,
    "tutorial-guide-material",
    "#ffe27d",
    "#f4b92f",
  );
  tutorialGuideMaterial.alpha = 0.96;
  tutorialGuideMaterial.disableLighting = true;
  const tutorialGuideBeamMaterial = makeMaterial(
    scene,
    "tutorial-guide-beam-material",
    "#ffe9a3",
    "#efad26",
  );
  tutorialGuideBeamMaterial.alpha = 0.18;
  tutorialGuideBeamMaterial.disableLighting = true;
  const tutorialGuideRoot = new TransformNode("tutorial-guide-beacon", scene);
  const tutorialGuideRing = setMaterial(
    MeshBuilder.CreateTorus(
      "tutorial-guide-ring",
      { diameter: 3.15, thickness: 0.15, tessellation: 48 },
      scene,
    ),
    tutorialGuideMaterial,
  );
  tutorialGuideRing.parent = tutorialGuideRoot;
  tutorialGuideRing.position.y = 0.03;
  tutorialGuideRing.isPickable = false;
  const tutorialGuideBeam = setMaterial(
    MeshBuilder.CreateCylinder(
      "tutorial-guide-light-column",
      { height: 3.8, diameter: 0.16, tessellation: 16 },
      scene,
    ),
    tutorialGuideBeamMaterial,
  );
  tutorialGuideBeam.parent = tutorialGuideRoot;
  tutorialGuideBeam.position.y = 1.9;
  tutorialGuideBeam.isPickable = false;
  const tutorialGuideArrow = setMaterial(
    MeshBuilder.CreateCylinder(
      "tutorial-guide-down-arrow",
      {
        height: 0.72,
        diameterTop: 0.58,
        diameterBottom: 0,
        tessellation: 4,
      },
      scene,
    ),
    tutorialGuideMaterial,
  );
  tutorialGuideArrow.parent = tutorialGuideRoot;
  tutorialGuideArrow.position.y = 2.55;
  tutorialGuideArrow.isPickable = false;
  tutorialGuideRoot.setEnabled(false);
  let tutorialGuideScale = 1;
  let tutorialGuideTargetNode: TransformNode | null = null;
  glow.referenceMeshToUseItsOwnMaterial(tutorialGuideRing);
  glow.referenceMeshToUseItsOwnMaterial(tutorialGuideArrow);
  canvas.dataset.tutorialGuideVisual = "gold-ring-light-column";
  const setTutorialGuide = (guide: TutorialGuideTarget | null) => {
    const target = guide?.sourceId
      ? resourceTargets.get(guide.sourceId)
      : guide?.resident
        ? interactables.find((entry) => entry.resident === guide.resident)
        : null;
    if (!target) {
      tutorialGuideTargetNode = null;
      tutorialGuideRoot.setEnabled(false);
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      canvas.dataset.debugTutorialGuide =
        target.resourceId ?? target.resident ?? target.node.name;
    }
    tutorialGuideTargetNode = target.node;
    tutorialGuideRoot.position.copyFrom(target.node.getAbsolutePosition());
    tutorialGuideScale = target.kind === "resident" ? 0.78 : 1;
    tutorialGuideRing.scaling.setAll(tutorialGuideScale);
    tutorialGuideRoot.setEnabled(true);
  };
  const keys = new Set<string>();
  let paused = false;
  let closest: Interactable | null = null;
  let realElapsedTime = 0;
  let gameElapsedTime = 0;
  let animationElapsedTime = 0;
  let playerAction: AnimationName | null = null;
  let playerActionState: PlayerActionState = FREE_PLAYER_ACTION;
  let playerActionUntil = 0;
  let pendingActivity: {
    result: ActivityResult;
    settleAt: number;
  } | null = null;
  let lastFpsUpdate = 0;
  let lastPositionUpdate = 0;
  const performanceSamples: number[] = [];
  let currentDayMinute = 8 * 60;
  let activeZone: WorldZoneDefinition | null = null;
  let currentProgression: WorldProgressionSnapshot = INITIAL_WORLD_PROGRESSION;
  let footstepTimer = 0;
  const furnitureMeshes = new Map<string, TransformNode>();
  const furnitureTargets = new Map<string, Interactable>();
  let currentFurniture = [...initialFurniture];
  let placementMode: PlacementMode | null = null;
  let placementPreview: PlacementPreview | null = null;
  let placementGhost: TransformNode | null = null;

  const resetCamera = () => {
    camera.alpha = THIRD_PERSON_CAMERA.alpha;
    camera.beta = THIRD_PERSON_CAMERA.beta;
    camera.radius = THIRD_PERSON_CAMERA.radius;
  };

  const clearPlacementGhost = () => {
    placementGhost?.dispose(false, false);
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
  const onTestTravel = (event: Event) => {
    if (!e2eMode) return;
    const detail = (event as CustomEvent<{ x: number; z: number }>).detail;
    if (!detail || !Number.isFinite(detail.x) || !Number.isFinite(detail.z)) return;
    const next = resolveWorldMovement(
      { x: player.root.position.x, z: player.root.position.z },
      { x: detail.x, z: detail.z },
      0.58,
      [...STATIC_WORLD_COLLIDERS, ...lockedAreaColliders(currentProgression)],
    );
    player.root.position.x = next.x;
    player.root.position.z = next.z;
    canvas.dataset.debugPlayerPosition = `${next.x.toFixed(3)},${next.z.toFixed(3)}`;
    callbacks.onPlayerMove(next);
  };
  if (e2eMode) canvas.addEventListener("lumi-test-travel", onTestTravel);

  const burstMaterialCache = new Map<string, StandardMaterial>();
  const burst = (position: Vector3, color: string) => {
    let mat = burstMaterialCache.get(color);
    if (!mat) {
      mat = makeMaterial(scene, `burst-${burstMaterialCache.size}`, color, color);
      burstMaterialCache.set(color, mat);
    }
    const particles: Mesh[] = [];
    for (let index = 0; index < detail.particleCount; index += 1) {
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
    const targetDirection = closest.node.getAbsolutePosition().subtract(player.root.position);
    targetDirection.y = 0;
    if (targetDirection.lengthSquared() > 0.001) {
      const facing = Math.atan2(targetDirection.x, targetDirection.z);
      playerMotion.setFacing(facing);
      player.root.rotation.y = facing;
    }
    playerMotion.setInteraction("interact");
    player.setAnimation("interact", 1, true);
    const activityKind: ActivityRequest["kind"] =
      closest.item === "wood"
        ? "wood"
        : closest.item === "stone"
          ? "stone"
          : closest.item === "fish"
            ? "fishing"
            : "forage";
    playerActionState = preparePlayerActivity(
      activityKind === "stone" ? "rock" : activityKind,
      closest.resourceId ?? closest.node.name,
    );
    keys.clear();
    callbacks.onActivity({
      kind: activityKind,
      item: closest.item,
      sourceId: closest.resourceId ?? closest.node.name,
    });
    closest = null;
    callbacks.onHint(null);
  };

  const resolveActivity = (result: ActivityResult) => {
    const target = resourceTargets.get(result.sourceId);
    const animation = animationForActivity(result.activityType);
    const duration = activityDuration(result);
    playerActionState = animatePlayerActivity(result);
    keys.clear();
    playerMotion.stop();
    if (target) {
      const targetDirection = target.node
        .getAbsolutePosition()
        .subtract(player.root.position);
      targetDirection.y = 0;
      if (targetDirection.lengthSquared() > 0.001) {
        const facing = Math.atan2(targetDirection.x, targetDirection.z);
        playerMotion.setFacing(facing);
        player.root.rotation.y = facing;
      }
      target.available = false;
      reactToGatherTarget(target);
      const color = ITEMS[target.item ?? result.rewardItems[0]?.itemId ?? "wood"].color;
      burst(target.node.getAbsolutePosition().add(new Vector3(0, 0.8, 0)), color);
    }
    playerAction = animation;
    playerActionUntil = gameElapsedTime + duration;
    playerMotion.setInteraction(animation);
    player.setAnimation(animation, 1, true);
    pendingActivity = {
      result,
      settleAt: gameElapsedTime + duration,
    };
  };
  const syncFurniture = (placed: PlacedFurniture[]) => {
    currentFurniture = [...placed];
    const desired = new Set(placed.map((item) => item.id));
    furnitureMeshes.forEach((node, id) => {
      if (!desired.has(id)) {
        node.dispose(false, false);
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
    refreshResourceAvailability();
  };

  scene.onBeforeRenderObservable.add(() => {
    const frameSeconds = engine.getDeltaTime() / 1000;
    const delta = Math.min(0.05, frameSeconds);
    const clockDelta = Math.min(0.25, frameSeconds);
    realElapsedTime += clockDelta;
    scene.metadata = {
      ...(scene.metadata ?? {}),
      phase2Timing: { realElapsedTime, gameElapsedTime, animationElapsedTime },
    };
    if (process.env.NODE_ENV !== "production") {
      canvas.dataset.debugAvailableResources = [...resourceTargets.entries()]
        .filter(([, target]) => target.available)
        .map(([sourceId]) => sourceId)
        .join(",");
      canvas.dataset.debugActionState =
        playerActionState.type === "free"
          ? "free"
          : `${playerActionState.activity}:${playerActionState.phase}`;
      canvas.dataset.debugPaused = String(paused);
      canvas.dataset.debugGameElapsedTime = gameElapsedTime.toFixed(3);
      canvas.dataset.debugPlayerPosition = `${player.root.position.x.toFixed(3)},${player.root.position.z.toFixed(3)}`;
    }
    if (paused) {
      playerMotion.stop();
      return;
    }
    gameElapsedTime += clockDelta;
    animationElapsedTime += clockDelta;
    if (playerAction && gameElapsedTime >= playerActionUntil) {
      playerAction = null;
      playerMotion.setInteraction(null);
    }
    if (pendingActivity && gameElapsedTime >= pendingActivity.settleAt) {
      const settled = pendingActivity.result;
      pendingActivity = null;
      playerActionState = rewardPlayerActivity(playerActionState);
      callbacks.onActivitySettled(settled);
    }


    const movementLocked = isPlayerMovementLocked(playerActionState);
    if (movementLocked) playerMotion.stop();
    const horizontal = movementLocked
      ? 0
      : (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const forwardAmount = movementLocked
      ? 0
      : (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const cameraForward = camera.target.subtract(camera.position);
    cameraForward.y = 0;
    const movement = cameraRelativeMovement(horizontal, forwardAmount, {
      x: cameraForward.x,
      z: cameraForward.z,
    });
    const input = new Vector3(movement.x, 0, movement.z);
    const running =
      !movementLocked && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
    const motion = playerMotion.update(
      { x: input.x, z: input.z },
      running,
      delta,
    );
    player.root.rotation.y = motion.facing;
    player.setAnimation(motion.animation, running ? 1.08 : 1);
    player.update(delta);
    const footstep = advanceFootstepCadence(
      footstepTimer,
      clockDelta,
      input.lengthSquared() > 0,
      running,
      movementLocked,
    );
    footstepTimer = footstep.timer;
    if (footstep.shouldPlay) {
      playSound("footstep");
      if (process.env.NODE_ENV !== "production") {
        const count = Number(canvas.dataset.debugFootstepCount ?? "0");
        canvas.dataset.debugFootstepCount = String(count + 1);
      }
    }

    const currentPosition = {
      x: player.root.position.x,
      z: player.root.position.z,
    };
    const desiredPosition = {
      x: currentPosition.x + motion.velocity.x * delta * movementSimulationScale,
      z: currentPosition.z + motion.velocity.z * delta * movementSimulationScale,
    };
    const dynamicColliders: WorldCollider[] = [
      ...STATIC_WORLD_COLLIDERS,
      ...lockedAreaColliders(currentProgression),
      ...npcs.map((npc, index) => ({
        kind: "circle" as const,
        id: `npc-${index}`,
        x: npc.rig.root.position.x,
        z: npc.rig.root.position.z,
        radius: npc.collisionRadius,
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
      playerConfig.colliderSize.radius,
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
    playerMarker.position.x = player.root.position.x;
    playerMarker.position.z = player.root.position.z;
    visiblePlayerAvatar.sync(player.root.position, player.root.rotation.y);
    const nextZone = stableWorldZoneAt(
      {
        x: player.root.position.x,
        z: player.root.position.z,
      },
      activeZone,
    );
    if (activeZone?.id !== nextZone.id) {
      activeZone = nextZone;
      canvas.dataset.zone = nextZone.id;
      callbacks.onZoneChange(nextZone);
    }
    visiblePlayerAvatar.update(motion.animation, delta);

    const desiredCameraTarget = thirdPersonCameraTarget({
      x: player.root.position.x,
      y: player.root.position.y,
      z: player.root.position.z,
    });
    camera.target = Vector3.Lerp(
      camera.target,
      new Vector3(
        desiredCameraTarget.x,
        desiredCameraTarget.y,
        desiredCameraTarget.z,
      ),
      Math.min(1, delta * THIRD_PERSON_CAMERA.followSpeed),
    );

    const cameraPoint = { x: camera.position.x, z: camera.position.z };
    const playerPoint = {
      x: player.root.position.x,
      z: player.root.position.z,
    };
    occluderNodes.forEach((node) => {
      const targetVisibility = targetOccluderVisibility(
        cameraPoint,
        playerPoint,
        node.getAbsolutePosition(),
      );
      node.getChildMeshes().forEach((mesh) => {
        mesh.visibility = smoothVisibility(
          mesh.visibility,
          targetVisibility,
          delta,
        );
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
              sourceId: closest.resourceId ?? closest.node.name,
              item: closest.item,
              resident: closest.resident,
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

    if (process.env.NODE_ENV !== "production") {
      canvas.dataset.debugClosestTarget = closest?.resident ?? closest?.resourceId ?? closest?.furnitureId ?? "";
      canvas.dataset.debugNpcPositions = npcs
        .map((npc) => `${npc.resident}:${npc.rig.root.position.x.toFixed(3)},${npc.rig.root.position.z.toFixed(3)}`)
        .join(";");
    }
    npcs.forEach((npc) => {
      let npcAnimation: AnimationName = "idle";
      const radius = npc.wanderRadius;
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
          npc.collisionRadius,
          [...STATIC_WORLD_COLLIDERS, ...furnitureColliders],
          [
            {
              id: "player",
              x: player.root.position.x,
              z: player.root.position.z,
              radius: playerConfig.colliderSize.radius,
            },
            ...npcs
              .filter((other) => other !== npc)
              .map((other, otherIndex) => ({
                id: `other-npc-${otherIndex}`,
                x: other.rig.root.position.x,
                z: other.rig.root.position.z,
                radius: other.collisionRadius,
              })),
          ],
        );
        npc.rig.root.position.x = resolvedNpcPosition.x;
        npc.rig.root.position.z = resolvedNpcPosition.z;
        npc.rig.root.rotation.y = Math.atan2(direction.x, direction.z);
        npcAnimation =
          gameElapsedTime < npc.actionUntil ? "talk" : "walk";
        npc.rig.setAnimation(
          npcAnimation,
          gameElapsedTime < npc.actionUntil ? 1 : 0.82,
        );
      } else {
        npcAnimation =
          gameElapsedTime < npc.actionUntil ? "talk" : "idle";
        npc.rig.setAnimation(npcAnimation);
      }
      npc.rig.update(delta);
      npc.rig.root.position.y = 0.44;
      npc.fallbackAvatar.sync(
        npc.rig.root.position,
        npc.rig.root.rotation.y,
      );
      npc.fallbackAvatar.update(npcAnimation, delta);
      npc.marker.sync(npc.rig.root.position);
    });

    const nightGarden = nightGardenPresentation(
      currentProgression.collectionMilestones.includes(75),
      currentDayMinute,
    );
    progressionLandmarks.collectionSeventyFive.setEnabled(nightGarden.active);
    const hour = currentDayMinute / 60;
    const daylight = Math.max(0.18, Math.sin(((hour - 5) / 14) * Math.PI));
    const evening = hour >= 16.5 || hour < 6;
    hemi.intensity = 0.25 + daylight * 0.72;
    sun.intensity = 0.3 + daylight * 1.05;
    sun.diffuse = evening
      ? Color3.FromHexString("#e49a67")
      : Color3.FromHexString("#fff2d0");
    glow.intensity = (evening ? 0.75 : 0.26) * detail.glowIntensityScale;
    if (tutorialGuideRoot.isEnabled() && tutorialGuideTargetNode) {
      tutorialGuideRoot.position.copyFrom(
        tutorialGuideTargetNode.getAbsolutePosition(),
      );
      const guidePulse = 1 + Math.sin(animationElapsedTime * 3.2) * 0.1;
      tutorialGuideRing.scaling.x = tutorialGuideScale * guidePulse;
      tutorialGuideRing.scaling.y = tutorialGuideScale;
      tutorialGuideRing.scaling.z = tutorialGuideScale * guidePulse;
      tutorialGuideArrow.position.y =
        2.55 + Math.sin(animationElapsedTime * 2.7) * 0.22;
      tutorialGuideArrow.rotation.y = animationElapsedTime * 1.25;
      tutorialGuideBeamMaterial.alpha =
        0.14 + (Math.sin(animationElapsedTime * 2.4) + 1) * 0.055;
    }
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = evening
      ? Color3.FromHexString("#294b50")
      : Color3.FromHexString("#a9d0c6");

    lastPositionUpdate += delta;
    if (lastPositionUpdate >= debugPositionInterval) {
      lastPositionUpdate = 0;
      callbacks.onPlayerMove({
        x: Number(player.root.position.x.toFixed(2)),
        z: Number(player.root.position.z.toFixed(2)),
      });
    }
    lastFpsUpdate += delta;
    if (lastFpsUpdate >= 1) {
      lastFpsUpdate = 0;
      const fps = Math.round(engine.getFps());
      performanceSamples.push(fps);
      if (performanceSamples.length > 60) performanceSamples.shift();
      const averageFps = Math.round(
        performanceSamples.reduce((sum, value) => sum + value, 0) /
          performanceSamples.length,
      );
      const minimumFps = Math.min(...performanceSamples);
      const frameTimes = performanceSamples
        .map((value) => 1000 / Math.max(1, value))
        .sort((a, b) => a - b);
      const p95FrameMs = frameTimes[Math.floor((frameTimes.length - 1) * 0.95)];
      canvas.dataset.debugFps = String(fps);
      canvas.dataset.performanceSnapshot = JSON.stringify({
        sampleSeconds: performanceSamples.length,
        averageFps,
        minimumFps,
        p95FrameMs: Number(p95FrameMs.toFixed(2)),
        meshes: scene.meshes.length,
        activeMeshes: scene.getActiveMeshes().length,
        materials: scene.materials.length,
        textures: scene.textures.length,
        animationGroups: scene.animationGroups.length,
        detailLevel: detail.level,
      });
      callbacks.onFps(fps);
    }
    const pulse = 1 + Math.sin(animationElapsedTime * 2) * 0.07;
    fishingRipples.forEach((mesh, index) => {
      mesh.rotation.y += delta * (index === 0 ? 0.3 : -0.24);
      mesh.scaling.x = pulse;
      mesh.scaling.z = (index === 0 ? 0.65 : 0.78) * pulse;
    });
  });

  engine.runRenderLoop(() => scene.render());
  const resize = () => engine.resize();
  window.addEventListener("resize", resize);

  return {
    scene,
    setPaused: (value) => {
      paused = value;
      if (value) {
        keys.clear();
      } else if (
        playerActionState.type === "activity" &&
        playerActionState.phase === "prepare" &&
        pendingActivity === null
      ) {
        playerActionState = FREE_PLAYER_ACTION;
      }
    },
    setDayMinute,
    setProgression: (progression) => {
      currentProgression = progression;
      syncProgressionLandmarks(
        progressionLandmarks,
        progression.islandRank,
        progression.groveRepairs,
        progression.collectionMilestones,
        progression.bridgeRepaired,
        progression.nollaFriendship,
      );
      refreshResourceAvailability();
      if (process.env.NODE_ENV !== "production") {
        canvas.dataset.debugBridgeRepaired = String(progression.bridgeRepaired);
        canvas.dataset.debugCollectionUnlocks = progression.collectionMilestones.join(",");
        canvas.dataset.debugGroveRepairs = String(progression.groveRepairs);
      }
    },
    syncFurniture,
    setPlacementMode,
    setTutorialGuide,
    syncResourceStates,
    resolveActivity,
    resetCamera,
    dispose: () => {
      visiblePlayerAvatar.dispose();
      if (disposalStarted) return;
      disposalStarted = true;
      engine.stopRenderLoop();
      player.dispose();
      npcs.forEach((npc) => {
        npc.marker.dispose();
        npc.fallbackAvatar.dispose();
        npc.rig.dispose();
      });
      placementGhost?.dispose(false, false);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("lumi-test-travel", onTestTravel);
      window.removeEventListener("resize", resize);
      void Promise.allSettled(pendingAssetLoads).then(() => {
        resourceVisuals.forEach((controller) => controller.dispose());
        scene.dispose();
        engine.dispose();
      });
    },
  };
}
