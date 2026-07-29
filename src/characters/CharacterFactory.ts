import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type {
  AnimationName,
  CharacterPalette,
} from "@/src/game/types";

export interface CharacterRig {
  root: TransformNode;
  head: TransformNode;
  leftArm: TransformNode;
  rightArm: TransformNode;
  leftLeg: TransformNode;
  rightLeg: TransformNode;
  setAnimation: (name: AnimationName, elapsed: number, speed?: number) => void;
  dispose: () => void;
}

const materialCache = new Map<string, StandardMaterial>();

function material(scene: Scene, name: string, hex: string): StandardMaterial {
  const key = `${scene.uid}-${name}-${hex}`;
  const cached = materialCache.get(key);
  if (cached) return cached;
  const next = new StandardMaterial(name, scene);
  next.diffuseColor = Color3.FromHexString(hex);
  next.specularColor = new Color3(0.05, 0.045, 0.04);
  next.roughness = 0.88;
  materialCache.set(key, next);
  return next;
}

function roundedPart(
  scene: Scene,
  name: string,
  parent: TransformNode,
  scale: Vector3,
  position: Vector3,
  mat: StandardMaterial,
  segments = 16,
): Mesh {
  const mesh = MeshBuilder.CreateIcoSphere(
    name,
    { radius: 0.5, subdivisions: segments > 12 ? 3 : 2, flat: false },
    scene,
  );
  mesh.parent = parent;
  mesh.scaling = scale;
  mesh.position = position;
  mesh.material = mat;
  return mesh;
}

function taperedLimb(
  scene: Scene,
  name: string,
  parent: TransformNode,
  height: number,
  top: number,
  bottom: number,
  position: Vector3,
  mat: StandardMaterial,
): Mesh {
  const mesh = MeshBuilder.CreateCylinder(
    name,
    {
      height,
      diameterTop: top,
      diameterBottom: bottom,
      tessellation: 12,
    },
    scene,
  );
  mesh.parent = parent;
  mesh.position = position;
  mesh.material = mat;
  return mesh;
}

export function createCharacter(
  scene: Scene,
  palette: CharacterPalette,
  position: Vector3,
  scale = 1,
): CharacterRig {
  const root = new TransformNode(`${palette.id}-character`, scene);
  root.position = position.clone();
  root.scaling.setAll(scale);

  const skin = material(scene, `${palette.id}-skin`, palette.skin);
  const hair = material(scene, `${palette.id}-hair`, palette.hair);
  const primary = material(scene, `${palette.id}-primary`, palette.primary);
  const secondary = material(scene, `${palette.id}-secondary`, palette.secondary);
  const accent = material(scene, `${palette.id}-accent`, palette.accent);
  const eye = material(scene, "eye", "#2a2725");
  const sole = material(scene, "sole", "#342f2a");

  const sturdy = palette.silhouette === "sturdy";
  const gentle = palette.silhouette === "gentle";
  const bodyWidth = sturdy ? 1.02 : gentle ? 0.82 : 0.88;
  const body = roundedPart(
    scene,
    `${palette.id}-torso`,
    root,
    new Vector3(bodyWidth, 1.18, 0.66),
    new Vector3(0, 1.86, 0),
    primary,
  );
  body.rotation.x = -0.03;

  const belt = MeshBuilder.CreateTorus(
    `${palette.id}-belt`,
    {
      diameter: bodyWidth * 0.93,
      thickness: 0.075,
      tessellation: 24,
    },
    scene,
  );
  belt.parent = root;
  belt.position.set(0, 1.56, 0);
  belt.rotation.x = Math.PI / 2;
  belt.scaling.z = 0.7;
  belt.material = secondary;

  const neck = taperedLimb(
    scene,
    `${palette.id}-neck`,
    root,
    0.32,
    0.33,
    0.37,
    new Vector3(0, 2.63, 0),
    skin,
  );
  neck.rotation.z = 0.02;

  const head = new TransformNode(`${palette.id}-head-rig`, scene);
  head.parent = root;
  head.position.set(0, 3.15, -0.02);
  roundedPart(
    scene,
    `${palette.id}-head`,
    head,
    new Vector3(sturdy ? 1.03 : 1, 1.03, 0.88),
    Vector3.Zero(),
    skin,
  );

  roundedPart(
    scene,
    `${palette.id}-left-ear`,
    head,
    new Vector3(0.22, 0.3, 0.14),
    new Vector3(-0.52, 0, 0),
    skin,
    10,
  );
  roundedPart(
    scene,
    `${palette.id}-right-ear`,
    head,
    new Vector3(0.22, 0.3, 0.14),
    new Vector3(0.52, 0, 0),
    skin,
    10,
  );

  const leftEye = roundedPart(
    scene,
    `${palette.id}-left-eye`,
    head,
    new Vector3(0.105, 0.15, 0.045),
    new Vector3(-0.2, 0.08, 0.445),
    eye,
    8,
  );
  const rightEye = roundedPart(
    scene,
    `${palette.id}-right-eye`,
    head,
    new Vector3(0.105, 0.15, 0.045),
    new Vector3(0.2, 0.08, 0.445),
    eye,
    8,
  );
  leftEye.rotation.x = rightEye.rotation.x = 0.02;

  const nose = roundedPart(
    scene,
    `${palette.id}-nose`,
    head,
    new Vector3(0.085, 0.1, 0.08),
    new Vector3(0, -0.04, 0.49),
    skin,
    8,
  );
  nose.rotation.x = 0.2;

  const hairCap = roundedPart(
    scene,
    `${palette.id}-hair-cap`,
    head,
    new Vector3(1.04, 0.48, 0.58),
    new Vector3(0, 0.62, -0.28),
    hair,
  );
  hairCap.rotation.z = palette.id === "nolla" ? -0.12 : 0.03;

  const hairCount = palette.id === "kai" ? 12 : palette.id === "sera" ? 9 : 7;
  for (let index = 0; index < hairCount; index += 1) {
    const angle = (index / hairCount) * Math.PI * 2;
    if (Math.sin(angle) > 0.15) continue;
    const curl = roundedPart(
      scene,
      `${palette.id}-hair-${index}`,
      head,
      new Vector3(
        palette.id === "kai" ? 0.27 : 0.24,
        palette.id === "sera" ? 0.22 : 0.27,
        0.22,
      ),
      new Vector3(
        Math.cos(angle) * 0.48,
        0.52 + Math.sin(index * 1.7) * 0.08,
        Math.min(0.06, Math.sin(angle) * 0.39),
      ),
      hair,
      8,
    );
    curl.rotation.z = angle * 0.25;
  }

  if (palette.id === "mira") {
    const scarf = MeshBuilder.CreateTorus(
      "mira-scarf",
      { diameter: 0.72, thickness: 0.16, tessellation: 22 },
      scene,
    );
    scarf.parent = root;
    scarf.position.set(0, 2.56, -0.02);
    scarf.rotation.x = Math.PI / 2;
    scarf.material = accent;
  }

  if (palette.id === "sera") {
    for (let index = 0; index < 7; index += 1) {
      const braid = roundedPart(
        scene,
        `sera-braid-${index}`,
        head,
        new Vector3(0.19, 0.17, 0.17),
        new Vector3(-0.47 + index * 0.155, 0.5, -0.29),
        hair,
        8,
      );
      braid.rotation.z = index * 0.14;
    }
  }

  const makeArm = (side: -1 | 1) => {
    const arm = new TransformNode(
      `${palette.id}-${side < 0 ? "left" : "right"}-arm-rig`,
      scene,
    );
    arm.parent = root;
    arm.position.set(side * bodyWidth * 0.48, 2.25, 0);
    taperedLimb(
      scene,
      `${palette.id}-upper-arm-${side}`,
      arm,
      0.68,
      0.31,
      0.25,
      new Vector3(side * 0.1, -0.3, 0),
      secondary,
    ).rotation.z = side * -0.12;
    taperedLimb(
      scene,
      `${palette.id}-forearm-${side}`,
      arm,
      0.58,
      0.24,
      0.19,
      new Vector3(side * 0.16, -0.84, -0.03),
      skin,
    ).rotation.z = side * -0.08;
    roundedPart(
      scene,
      `${palette.id}-hand-${side}`,
      arm,
      new Vector3(0.24, 0.28, 0.2),
      new Vector3(side * 0.19, -1.16, -0.04),
      skin,
      8,
    );
    return arm;
  };

  const makeLeg = (side: -1 | 1) => {
    const leg = new TransformNode(
      `${palette.id}-${side < 0 ? "left" : "right"}-leg-rig`,
      scene,
    );
    leg.parent = root;
    leg.position.set(side * 0.25, 1.25, 0);
    taperedLimb(
      scene,
      `${palette.id}-thigh-${side}`,
      leg,
      0.62,
      0.38,
      0.3,
      new Vector3(0, -0.25, 0),
      primary,
    );
    taperedLimb(
      scene,
      `${palette.id}-shin-${side}`,
      leg,
      0.58,
      0.28,
      0.23,
      new Vector3(0, -0.78, 0),
      skin,
    );
    const foot = roundedPart(
      scene,
      `${palette.id}-foot-${side}`,
      leg,
      new Vector3(0.35, 0.24, 0.48),
      new Vector3(0, -1.11, -0.14),
      sole,
      8,
    );
    foot.rotation.x = -0.12;
    return leg;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  if (palette.id === "mira") {
    const lantern = roundedPart(
      scene,
      "mira-lantern",
      rightArm,
      new Vector3(0.24, 0.3, 0.2),
      new Vector3(0.22, -1.21, -0.2),
      accent,
      8,
    );
    lantern.material = accent;
  } else if (palette.id === "nolla") {
    const tool = taperedLimb(
      scene,
      "nolla-tool",
      root,
      0.9,
      0.09,
      0.08,
      new Vector3(0.5, 1.7, 0.35),
      accent,
    );
    tool.rotation.z = -0.35;
  } else if (palette.id === "kai") {
    const satchel = roundedPart(
      scene,
      "kai-net-bag",
      root,
      new Vector3(0.44, 0.56, 0.22),
      new Vector3(-0.48, 1.55, 0.17),
      secondary,
    );
    satchel.rotation.z = -0.13;
  } else {
    const satchel = roundedPart(
      scene,
      "sera-herb-bag",
      root,
      new Vector3(0.42, 0.48, 0.22),
      new Vector3(0.46, 1.56, 0.2),
      secondary,
    );
    satchel.rotation.z = 0.12;
  }

  const setAnimation = (
    name: AnimationName,
    elapsed: number,
    speed = 1,
  ) => {
    const stride =
      name === "run" ? 0.75 : name === "walk" ? 0.48 : name === "pickup" ? 0.18 : 0;
    const cycle = Math.sin(elapsed * (name === "run" ? 11 : 7) * speed);
    leftLeg.rotation.x = cycle * stride;
    rightLeg.rotation.x = -cycle * stride;
    leftArm.rotation.x = -cycle * stride * 0.72;
    rightArm.rotation.x = cycle * stride * 0.72;
    root.position.y = Math.abs(cycle) * (name === "run" ? 0.06 : stride ? 0.025 : 0);
    body.rotation.z = cycle * stride * 0.025;

    if (name === "talk") {
      rightArm.rotation.x = -0.36 + Math.sin(elapsed * 4) * 0.13;
      rightArm.rotation.z = -0.35;
      head.rotation.y = Math.sin(elapsed * 2.2) * 0.08;
    } else if (name === "interact" || name === "pickup") {
      head.rotation.x = 0.22;
      leftArm.rotation.x = -0.65;
      rightArm.rotation.x = -0.65;
    } else if (name === "happy") {
      leftArm.rotation.z = -1.25;
      rightArm.rotation.z = 1.25;
      root.position.y += Math.abs(Math.sin(elapsed * 5)) * 0.08;
    } else if (name === "surprised") {
      head.rotation.x = -0.15;
      leftArm.rotation.z = -0.72;
      rightArm.rotation.z = 0.72;
    } else {
      head.rotation.x = Math.sin(elapsed * 1.1) * 0.015;
      head.rotation.y = Math.sin(elapsed * 0.7) * 0.035;
      leftArm.rotation.z = 0;
      rightArm.rotation.z = 0;
    }

    const blink = Math.sin(elapsed * 0.73) > 0.992 ? 0.12 : 1;
    leftEye.scaling.y = 0.15 * blink;
    rightEye.scaling.y = 0.15 * blink;
  };

  return {
    root,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    setAnimation,
    dispose: () => root.dispose(false, true),
  };
}
