import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { ResourceDefinition } from "@/src/resources/ResourceDefinitions";

export interface ResourceMaterials {
  wood: StandardMaterial;
  leaf: StandardMaterial;
  leafLight: StandardMaterial;
  stone: StandardMaterial;
  berry: StandardMaterial;
  herb: StandardMaterial;
  shell: StandardMaterial;
  glow: StandardMaterial;
}

function setMaterial(mesh: Mesh, material: StandardMaterial): Mesh {
  mesh.material = material;
  return mesh;
}
function createTree(
  scene: Scene,
  position: Vector3,
  mats: ResourceMaterials,
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

export function createResourceVisual(
  scene: Scene,
  definition: ResourceDefinition,
  materials: ResourceMaterials,
): TransformNode {
  const position = new Vector3(
    definition.position.x,
    0.42,
    definition.position.z,
  );
  let node: TransformNode;
  if (definition.visualType === "cedar-tree") {
    node = createTree(scene, position, materials, definition.visualIndex);
  } else if (definition.visualType === "moon-rock") {
    node = createRockCluster(scene, position, materials.stone, definition.visualIndex);
  } else if (definition.visualType === "berry-bush") {
    node = createBush(
      scene,
      position,
      materials.leaf,
      materials.berry,
      definition.visualIndex,
    );
  } else if (definition.visualType === "shell-patch") {
    node = createShellPatch(scene, position, materials.shell, definition.visualIndex);
  } else {
    const material =
      definition.visualType === "herb-patch"
        ? materials.herb
        : definition.visualType === "glowcap-patch"
          ? materials.glow
          : materials.leafLight;
    node = createSmallPatch(
      scene,
      position,
      material,
      definition.visualType,
      definition.visualIndex,
      definition.visualType === "glowcap-patch",
    );
  }
  node.rotation.y = definition.rotation ?? 0;
  return node;
}