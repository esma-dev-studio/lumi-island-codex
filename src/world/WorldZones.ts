import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Position2D } from "@/src/game/types";

export type WorldZoneId = "meadow" | "forest" | "harbor" | "moon-garden";

export interface WorldZoneDefinition {
  id: WorldZoneId;
  name: string;
  reading: string;
  center: Position2D;
  radiusX: number;
  radiusZ: number;
  texturePath: string;
  tint: string;
}

export const WORLD_ZONES: readonly WorldZoneDefinition[] = [
  { id: "meadow", name: "ひかりの広場", reading: "ひかりの ひろば", center: { x: 0, z: 3 }, radiusX: 10.5, radiusZ: 9, texturePath: "/assets/generated/zone-meadow.webp", tint: "#d4df86" },
  { id: "forest", name: "こもれびの森", reading: "こもれびの もり", center: { x: -14.5, z: -1.5 }, radiusX: 10.5, radiusZ: 9.5, texturePath: "/assets/generated/zone-forest.webp", tint: "#4b8a67" },
  { id: "harbor", name: "さんごの港", reading: "さんごの みなと", center: { x: 14.5, z: -1.5 }, radiusX: 10.5, radiusZ: 9.5, texturePath: "/assets/generated/zone-harbor.webp", tint: "#e7b46f" },
  { id: "moon-garden", name: "月しずくの庭", reading: "つきしずくの にわ", center: { x: 0, z: -11.5 }, radiusX: 9.5, radiusZ: 7.5, texturePath: "/assets/generated/zone-moon-garden.webp", tint: "#687cb5" },
] as const;

export function worldZoneAt(position: Position2D): WorldZoneDefinition {
  let best = WORLD_ZONES[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const zone of WORLD_ZONES) {
    const dx = (position.x - zone.center.x) / zone.radiusX;
    const dz = (position.z - zone.center.z) / zone.radiusZ;
    const score = dx * dx + dz * dz;
    if (score < bestScore) {
      best = zone;
      bestScore = score;
    }
  }
  return best;
}

function material(scene: Scene, name: string, color: string): StandardMaterial {
  const value = new StandardMaterial(name, scene);
  value.diffuseColor = Color3.FromHexString(color);
  value.specularColor = new Color3(0.025, 0.025, 0.02);
  value.roughness = 0.96;
  return value;
}

function paintedMaterial(scene: Scene, zone: WorldZoneDefinition): StandardMaterial {
  const value = material(scene, `zone-${zone.id}-material`, zone.tint);
  const texture = new Texture(zone.texturePath, scene, true, false);
  texture.uScale = 2.2;
  texture.vScale = 2.2;
  value.diffuseTexture = texture;
  return value;
}

function finish(mesh: Mesh, parent: TransformNode, paint: StandardMaterial): Mesh {
  mesh.parent = parent;
  mesh.material = paint;
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  return mesh;
}

function createLandmark(scene: Scene, zone: WorldZoneDefinition, parent: TransformNode): void {
  const wood = material(scene, `${zone.id}-landmark-wood`, "#765038");
  const stone = material(scene, `${zone.id}-landmark-stone`, zone.id === "moon-garden" ? "#8e9bd0" : "#788b83");
  const accent = material(scene, `${zone.id}-landmark-accent`, zone.tint);
  accent.emissiveColor = Color3.FromHexString(zone.id === "moon-garden" ? "#33446f" : "#1c2a24");

  if (zone.id === "meadow") {
    const root = new TransformNode("meadow-wind-chime", scene);
    root.parent = parent;
    root.position.set(-1.5, 0.05, 8.4);
    const post = finish(MeshBuilder.CreateCylinder("meadow-chime-post", { height: 3.6, diameter: 0.24, tessellation: 12 }, scene), root, wood);
    post.position.y = 1.8;
    const crown = finish(MeshBuilder.CreateTorus("meadow-chime-crown", { diameter: 1.4, thickness: 0.13, tessellation: 28 }, scene), root, accent);
    crown.position.y = 3.35;
    crown.rotation.x = Math.PI / 2;
    for (let index = 0; index < 5; index += 1) {
      const bell = finish(MeshBuilder.CreateCylinder(`meadow-bell-${index}`, { height: 0.42, diameterTop: 0.24, diameterBottom: 0.4, tessellation: 12 }, scene), root, accent);
      bell.position.set(Math.cos(index * 1.26) * 0.55, 2.75 + (index % 2) * 0.18, Math.sin(index * 1.26) * 0.55);
    }
  } else if (zone.id === "forest") {
    const root = new TransformNode("forest-spirit-gate", scene);
    root.parent = parent;
    root.position.set(-20, 0.05, -3.8);
    for (const side of [-1, 1]) {
      const trunk = finish(MeshBuilder.CreateCylinder(`forest-gate-trunk-${side}`, { height: 4.2, diameterTop: 0.55, diameterBottom: 0.85, tessellation: 10 }, scene), root, wood);
      trunk.position.set(side * 1.55, 2.1, 0);
      const crown = finish(MeshBuilder.CreateIcoSphere(`forest-gate-crown-${side}`, { radius: 1.6, subdivisions: 2 }, scene), root, accent);
      crown.position.set(side * 1.55, 4.15, 0);
      crown.scaling.y = 0.78;
    }
    const lintel = finish(MeshBuilder.CreateBox("forest-gate-lintel", { width: 3.8, height: 0.45, depth: 0.62 }, scene), root, wood);
    lintel.position.y = 3.35;
  } else if (zone.id === "harbor") {
    const root = new TransformNode("harbor-lighthouse", scene);
    root.parent = parent;
    root.position.set(21, 0.05, -3.6);
    const tower = finish(MeshBuilder.CreateCylinder("harbor-lighthouse-tower", { height: 4.4, diameterTop: 1.05, diameterBottom: 1.75, tessellation: 24 }, scene), root, stone);
    tower.position.y = 2.2;
    const lantern = finish(MeshBuilder.CreateCylinder("harbor-lighthouse-lantern", { height: 0.8, diameter: 1.35, tessellation: 20 }, scene), root, accent);
    lantern.position.y = 4.65;
    const roof = finish(MeshBuilder.CreateCylinder("harbor-lighthouse-roof", { height: 0.7, diameterTop: 0, diameterBottom: 1.65, tessellation: 20 }, scene), root, wood);
    roof.position.y = 5.35;
  } else {
    const root = new TransformNode("moon-garden-crystals", scene);
    root.parent = parent;
    root.position.set(0, 0.05, -16.2);
    for (let index = 0; index < 7; index += 1) {
      const crystal = finish(MeshBuilder.CreateCylinder(`moon-crystal-${index}`, { height: 1.5 + (index % 3) * 0.55, diameterTop: 0, diameterBottom: 0.62, tessellation: 6 }, scene), root, accent);
      crystal.position.set(Math.cos(index * 0.9) * 1.6, crystal.getBoundingInfo().boundingBox.extendSizeWorld.y, Math.sin(index * 0.9) * 1.15);
      crystal.rotation.z = (index - 3) * 0.055;
    }
  }
}

export function createWorldZones(scene: Scene): TransformNode {
  const root = new TransformNode("four-zone-world", scene);
  for (const zone of WORLD_ZONES) {
    const ground = finish(
      MeshBuilder.CreateCylinder(`zone-ground-${zone.id}`, { height: 0.08, diameter: zone.radiusX * 2, tessellation: 64 }, scene),
      root,
      paintedMaterial(scene, zone),
    );
    ground.position.set(zone.center.x, 0.39, zone.center.z);
    ground.scaling.z = zone.radiusZ / zone.radiusX;
    createLandmark(scene, zone, root);
  }
  return root;
}
