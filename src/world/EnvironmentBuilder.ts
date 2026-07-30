import {
  Mesh,
  MeshBuilder,
  type Scene,
  type StandardMaterial,
  TransformNode,
} from "@babylonjs/core";

export interface EnvironmentMaterials {
  wood: StandardMaterial;
  stone: StandardMaterial;
  leafLight: StandardMaterial;
  glow: StandardMaterial;
}

export interface ProgressionLandmarks {
  rankTwo: TransformNode;
  rankThree: TransformNode;
  groveStages: TransformNode[];
  collectionFifty: TransformNode;
  collectionSeventyFive: TransformNode;
}

function withMaterial(mesh: Mesh, material: StandardMaterial): Mesh {
  mesh.material = material;
  return mesh;
}

function createBridge(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("rank-2-coast-bridge", scene);
  root.position.set(12.2, 0.25, 0.8);
  root.rotation.y = -0.18;
  for (let index = 0; index < 8; index += 1) {
    const plank = withMaterial(
      MeshBuilder.CreateBox(
        `rank-2-bridge-plank-${index}`,
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
        `rank-2-bridge-rail-${side}`,
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
  root.position.set(9.3, 0.5, -6.8);
  for (let index = 0; index < 4; index += 1) {
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
  return root;
}

function createNightGarden(scene: Scene, materials: EnvironmentMaterials): TransformNode {
  const root = new TransformNode("collection-75-night-garden", scene);
  root.position.set(-5.5, 0.45, -8.5);
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

export function createProgressionLandmarks(
  scene: Scene,
  materials: EnvironmentMaterials,
): ProgressionLandmarks {
  const landmarks = {
    rankTwo: createBridge(scene, materials),
    rankThree: createArch(scene, materials),
    groveStages: [1, 2, 3].map((stage) =>
      createGroveStage(scene, materials, stage),
    ),
    collectionFifty: createFishingDeck(scene, materials),
    collectionSeventyFive: createNightGarden(scene, materials),
  };
  landmarks.rankTwo.setEnabled(false);
  landmarks.rankThree.setEnabled(false);
  landmarks.groveStages.forEach((node) => node.setEnabled(false));
  landmarks.collectionFifty.setEnabled(false);
  landmarks.collectionSeventyFive.setEnabled(false);
  return landmarks;
}

export function syncProgressionLandmarks(
  landmarks: ProgressionLandmarks,
  islandRank: number,
  groveRepairs: number,
  collectionMilestones: number[],
): void {
  landmarks.rankTwo.setEnabled(islandRank >= 2);
  landmarks.rankThree.setEnabled(islandRank >= 3);
  landmarks.groveStages.forEach((node, index) =>
    node.setEnabled(groveRepairs >= index + 1),
  );
  landmarks.collectionFifty.setEnabled(collectionMilestones.includes(50));
  landmarks.collectionSeventyFive.setEnabled(collectionMilestones.includes(75));
}