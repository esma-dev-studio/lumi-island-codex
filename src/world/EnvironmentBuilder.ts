import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

export interface EnvironmentMaterials {
  wood: StandardMaterial;
  stone: StandardMaterial;
  leafLight: StandardMaterial;
  glow: StandardMaterial;
}

export interface ProgressionLandmarks {
  rankTwo: TransformNode;
  rankThree: TransformNode;
  bridge: TransformNode;
  bridgeIslet: TransformNode;
  groveStages: TransformNode[];
  collectionFifty: TransformNode;
  collectionSeventyFive: TransformNode;
  nollaWorkshop: TransformNode;
}

function withMaterial(mesh: Mesh, material: StandardMaterial): Mesh {
  mesh.material = material;
  return mesh;
}

function createBridge(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("repaired-bridge-to-islet", scene);
  root.position.set(12.2, 0.32, -2.45);
  root.rotation.y = 0.62;
  for (let index = 0; index < 8; index += 1) {
    const plank = withMaterial(
      MeshBuilder.CreateBox(
        `bridge-plank-${index}`,
        { width: 1.65, height: 0.18, depth: 0.62 },
        scene,
      ),
      materials.wood,
    );
    plank.parent = root;
    plank.position.set(0, Math.sin(index * 0.42) * 0.08, index * 0.58);
  }
  for (const side of [-1, 1]) {
    const rail = withMaterial(
      MeshBuilder.CreateCylinder(
        `bridge-rail-${side}`,
        { height: 4.3, diameter: 0.1, tessellation: 8 },
        scene,
      ),
      materials.wood,
    );
    rail.parent = root;
    rail.position.set(side * 0.75, 0.55, 2.05);
    rail.rotation.x = Math.PI / 2;
  }
  return root;
}

function createBridgeIslet(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("bridge-islet-play-area", scene);
  root.position.set(14.25, 0.08, -4.15);
  const ground = withMaterial(
    MeshBuilder.CreateCylinder(
      "bridge-islet-ground",
      { height: 0.35, diameter: 4.5, tessellation: 48 },
      scene,
    ),
    materials.leafLight,
  );
  ground.parent = root;
  ground.scaling.z = 0.82;
  for (let index = 0; index < 5; index += 1) {
    const stone = withMaterial(
      MeshBuilder.CreateIcoSphere(
        `bridge-islet-stone-${index}`,
        { radius: 0.24 + (index % 2) * 0.1, subdivisions: 1 },
        scene,
      ),
      materials.stone,
    );
    stone.parent = root;
    stone.position.set(
      Math.cos(index * 1.7) * 1.7,
      0.28,
      Math.sin(index * 1.7) * 1.25,
    );
    stone.scaling.y = 0.7;
  }
  return root;
}

function createRankTwoViewpoint(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("rank-2-viewpoint", scene);
  root.position.set(2.8, 0.45, -7.6);
  const deck = withMaterial(
    MeshBuilder.CreateCylinder(
      "rank-2-viewpoint-deck",
      { height: 0.24, diameter: 3.4, tessellation: 24 },
      scene,
    ),
    materials.wood,
  );
  deck.parent = root;
  for (const side of [-1, 1]) {
    const lamp = withMaterial(
      MeshBuilder.CreateCylinder(
        `rank-2-viewpoint-lamp-${side}`,
        { height: 1.5, diameter: 0.14, tessellation: 8 },
        scene,
      ),
      materials.wood,
    );
    lamp.parent = root;
    lamp.position.set(side * 1.15, 0.72, 0);
  }
  return root;
}

function createArch(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("rank-3-island-arch", scene);
  root.position.set(0, 0.45, -8.4);
  for (const side of [-1, 1]) {
    const post = withMaterial(
      MeshBuilder.CreateCylinder(
        `rank-3-arch-post-${side}`,
        { height: 2.7, diameter: 0.38, tessellation: 10 },
        scene,
      ),
      materials.stone,
    );
    post.parent = root;
    post.position.set(side * 1.25, 1.35, 0);
  }
  const crown = withMaterial(
    MeshBuilder.CreateBox(
      "rank-3-arch-crown",
      { width: 3.2, height: 0.42, depth: 0.55 },
      scene,
    ),
    materials.wood,
  );
  crown.parent = root;
  crown.position.y = 2.75;
  return root;
}

function createGroveStage(
  scene: Scene,
  materials: EnvironmentMaterials,
  stage: number,
): TransformNode {
  const root = new TransformNode(`restored-grove-${stage}`, scene);
  root.position.set(-11.5 + stage * 1.2, 0.45, -6.2 + stage * 0.55);
  const trunk = withMaterial(
    MeshBuilder.CreateCylinder(
      `restored-grove-trunk-${stage}`,
      { height: 1.2 + stage * 0.35, diameter: 0.28, tessellation: 8 },
      scene,
    ),
    materials.wood,
  );
  trunk.parent = root;
  trunk.position.y = 0.6 + stage * 0.18;
  const crown = withMaterial(
    MeshBuilder.CreateIcoSphere(
      `restored-grove-crown-${stage}`,
      { radius: 0.72 + stage * 0.15, subdivisions: 2 },
      scene,
    ),
    materials.leafLight,
  );
  crown.parent = root;
  crown.position.y = 1.45 + stage * 0.36;
  return root;
}

function createFishingDeck(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("collection-50-fishing-deck", scene);
  root.position.set(9.5, 0.42, -5.8);
  for (let index = 0; index < 5; index += 1) {
    const plank = withMaterial(
      MeshBuilder.CreateBox(
        `collection-50-deck-plank-${index}`,
        { width: 2.2, height: 0.14, depth: 0.5 },
        scene,
      ),
      materials.wood,
    );
    plank.parent = root;
    plank.position.z = index * 0.48;
  }
  const sign = withMaterial(
    MeshBuilder.CreateBox(
      "collection-50-fish-sign",
      { width: 1.5, height: 0.55, depth: 0.12 },
      scene,
    ),
    materials.wood,
  );
  sign.parent = root;
  sign.position.set(1.15, 0.8, 0.4);
  return root;
}

function createNightGarden(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("collection-75-night-garden", scene);
  root.position.set(-5.4, 0.45, -8.6);
  for (let index = 0; index < 9; index += 1) {
    const flower = withMaterial(
      MeshBuilder.CreateIcoSphere(
        `collection-75-night-flower-${index}`,
        { radius: 0.18 + (index % 3) * 0.04, subdivisions: 1 },
        scene,
      ),
      materials.glow,
    );
    flower.parent = root;
    flower.position.set(
      Math.cos(index * 1.7) * (0.6 + (index % 2) * 0.55),
      0.2 + (index % 3) * 0.08,
      Math.sin(index * 1.7) * (0.6 + (index % 2) * 0.55),
    );
  }
  return root;
}

function createNollaWorkshop(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("nolla-friendship-workshop", scene);
  root.position.set(-8.9, 0.45, 6.3);
  const table = withMaterial(
    MeshBuilder.CreateBox(
      "nolla-workshop-table",
      { width: 2.1, height: 0.18, depth: 0.85 },
      scene,
    ),
    materials.wood,
  );
  table.parent = root;
  table.position.y = 0.8;
  for (const side of [-1, 1]) {
    const leg = withMaterial(
      MeshBuilder.CreateBox(
        `nolla-workshop-leg-${side}`,
        { width: 0.18, height: 0.8, depth: 0.65 },
        scene,
      ),
      materials.wood,
    );
    leg.parent = root;
    leg.position.set(side * 0.72, 0.4, 0);
  }
  return root;
}

export function createProgressionLandmarks(
  scene: Scene,
  materials: EnvironmentMaterials,
): ProgressionLandmarks {
  const landmarks: ProgressionLandmarks = {
    rankTwo: createRankTwoViewpoint(scene, materials),
    rankThree: createArch(scene, materials),
    bridge: createBridge(scene, materials),
    bridgeIslet: createBridgeIslet(scene, materials),
    groveStages: [1, 2, 3].map((stage) => createGroveStage(scene, materials, stage)),
    collectionFifty: createFishingDeck(scene, materials),
    collectionSeventyFive: createNightGarden(scene, materials),
    nollaWorkshop: createNollaWorkshop(scene, materials),
  };
  Object.values(landmarks).forEach((value) => {
    if (Array.isArray(value)) value.forEach((node) => node.setEnabled(false));
    else value.setEnabled(false);
  });
  return landmarks;
}

export function syncProgressionLandmarks(
  landmarks: ProgressionLandmarks,
  islandRank: number,
  groveRepairs: number,
  collectionMilestones: readonly number[],
  bridgeRepaired: boolean,
  nollaFriendship: number,
): void {
  landmarks.rankTwo.setEnabled(islandRank >= 2);
  landmarks.rankThree.setEnabled(islandRank >= 3);
  landmarks.bridge.setEnabled(bridgeRepaired);
  landmarks.bridgeIslet.setEnabled(bridgeRepaired);
  landmarks.groveStages.forEach((node, index) =>
    node.setEnabled(groveRepairs >= index + 1),
  );
  landmarks.collectionFifty.setEnabled(collectionMilestones.includes(50));
  landmarks.collectionSeventyFive.setEnabled(collectionMilestones.includes(75));
  landmarks.nollaWorkshop.setEnabled(nollaFriendship >= 3);
}