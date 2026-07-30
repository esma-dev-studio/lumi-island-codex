import type { Position2D } from "@/src/game/types";

export interface CircleCollider {
  kind: "circle";
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface BoxCollider {
  kind: "box";
  id: string;
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  rotation?: number;
}

export interface EllipseCollider {
  kind: "ellipse";
  id: string;
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
}

export type WorldCollider = CircleCollider | BoxCollider | EllipseCollider;

export interface IslandBounds {
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
}

const EPSILON = 0.000001;

export const ISLAND_WALK_BOUNDS: IslandBounds = {
  x: 0,
  z: 0,
  radiusX: 17.45,
  radiusZ: 12.55,
};

export const STATIC_WORLD_COLLIDERS: WorldCollider[] = [
  box("house-mira", 0, 8.7, 2.45, 2.05, 0),
  box("house-nolla", -10.5, 5.4, 2.45, 2.05, 0.55),
  box("house-kai", 10.5, 3.9, 2.45, 2.05, -0.55),
  box("house-sera", 5.8, -7.8, 2.45, 2.05, 2.55),
  ellipse("moon-pond", -8, -2, 3.55, 2.55),
  ...[
    [-13, -4],
    [-11, -7],
    [-7, -8.8],
    [-4, -9.4],
    [10.8, -5.8],
    [13.2, -2.5],
    [-14, 1],
    [14.5, 2],
    [-7.7, 7.6],
  ].map(([x, z], index) => circle(`tree-${index}`, x, z, 1.05)),
  ...[
    [-5.3, 4.5],
    [8, 7],
    [11.4, -0.8],
    [-3, -7.2],
  ].map(([x, z], index) => circle(`rock-${index}`, x, z, 0.95)),
];

export function resolveWorldMovement(
  current: Position2D,
  desired: Position2D,
  playerRadius: number,
  colliders: readonly WorldCollider[],
  bounds: IslandBounds = ISLAND_WALK_BOUNDS,
): Position2D {
  let resolved = clampInsideIsland(desired, playerRadius, bounds);
  for (let pass = 0; pass < 3; pass += 1) {
    for (const collider of colliders) {
      resolved = pushOutsideCollider(
        resolved,
        current,
        playerRadius,
        collider,
      );
    }
    resolved = clampInsideIsland(resolved, playerRadius, bounds);
  }
  return resolved;
}

export function pointOverlapsCollider(
  point: Position2D,
  radius: number,
  collider: WorldCollider,
): boolean {
  if (collider.kind === "circle") {
    return (
      Math.hypot(point.x - collider.x, point.z - collider.z) <
      radius + collider.radius
    );
  }
  if (collider.kind === "ellipse") {
    const radiusX = collider.radiusX + radius;
    const radiusZ = collider.radiusZ + radius;
    const dx = (point.x - collider.x) / radiusX;
    const dz = (point.z - collider.z) / radiusZ;
    return dx * dx + dz * dz < 1;
  }
  const local = toLocal(point, collider);
  return (
    Math.abs(local.x) < collider.halfWidth + radius &&
    Math.abs(local.z) < collider.halfDepth + radius
  );
}

export function isInsideIsland(
  point: Position2D,
  radius = 0,
  bounds: IslandBounds = ISLAND_WALK_BOUNDS,
): boolean {
  const radiusX = Math.max(EPSILON, bounds.radiusX - radius);
  const radiusZ = Math.max(EPSILON, bounds.radiusZ - radius);
  const dx = (point.x - bounds.x) / radiusX;
  const dz = (point.z - bounds.z) / radiusZ;
  return dx * dx + dz * dz <= 1;
}

function pushOutsideCollider(
  point: Position2D,
  fallback: Position2D,
  radius: number,
  collider: WorldCollider,
): Position2D {
  if (!pointOverlapsCollider(point, radius, collider)) return point;
  if (collider.kind === "circle") {
    const dx = point.x - collider.x;
    const dz = point.z - collider.z;
    const distance = Math.hypot(dx, dz);
    const fallbackDx = fallback.x - collider.x;
    const fallbackDz = fallback.z - collider.z;
    const fallbackDistance = Math.hypot(fallbackDx, fallbackDz);
    const direction =
      distance > EPSILON
        ? { x: dx / distance, z: dz / distance }
        : fallbackDistance > EPSILON
          ? {
              x: fallbackDx / fallbackDistance,
              z: fallbackDz / fallbackDistance,
            }
          : { x: 1, z: 0 };
    const target = collider.radius + radius;
    return {
      x: collider.x + direction.x * target,
      z: collider.z + direction.z * target,
    };
  }
  if (collider.kind === "ellipse") {
    const radiusX = collider.radiusX + radius;
    const radiusZ = collider.radiusZ + radius;
    let dx = point.x - collider.x;
    let dz = point.z - collider.z;
    if (Math.abs(dx) + Math.abs(dz) < EPSILON) {
      dx = fallback.x - collider.x;
      dz = fallback.z - collider.z;
    }
    if (Math.abs(dx) + Math.abs(dz) < EPSILON) dx = 1;
    const scale = 1 / Math.sqrt((dx * dx) / (radiusX * radiusX) + (dz * dz) / (radiusZ * radiusZ));
    return {
      x: collider.x + dx * scale,
      z: collider.z + dz * scale,
    };
  }

  const local = toLocal(point, collider);
  const halfWidth = collider.halfWidth + radius;
  const halfDepth = collider.halfDepth + radius;
  const distanceToX = halfWidth - Math.abs(local.x);
  const distanceToZ = halfDepth - Math.abs(local.z);
  const pushed =
    distanceToX < distanceToZ
      ? { x: Math.sign(local.x || 1) * halfWidth, z: local.z }
      : { x: local.x, z: Math.sign(local.z || 1) * halfDepth };
  return fromLocal(pushed, collider);
}

function clampInsideIsland(
  point: Position2D,
  radius: number,
  bounds: IslandBounds,
): Position2D {
  const radiusX = Math.max(EPSILON, bounds.radiusX - radius);
  const radiusZ = Math.max(EPSILON, bounds.radiusZ - radius);
  const dx = point.x - bounds.x;
  const dz = point.z - bounds.z;
  const normalized = (dx * dx) / (radiusX * radiusX) + (dz * dz) / (radiusZ * radiusZ);
  if (normalized <= 1) return point;
  const scale = 1 / Math.sqrt(normalized);
  return { x: bounds.x + dx * scale, z: bounds.z + dz * scale };
}

function toLocal(point: Position2D, collider: BoxCollider): Position2D {
  const rotation = -(collider.rotation ?? 0);
  const dx = point.x - collider.x;
  const dz = point.z - collider.z;
  return {
    x: dx * Math.cos(rotation) - dz * Math.sin(rotation),
    z: dx * Math.sin(rotation) + dz * Math.cos(rotation),
  };
}

function fromLocal(point: Position2D, collider: BoxCollider): Position2D {
  const rotation = collider.rotation ?? 0;
  return {
    x:
      collider.x +
      point.x * Math.cos(rotation) -
      point.z * Math.sin(rotation),
    z:
      collider.z +
      point.x * Math.sin(rotation) +
      point.z * Math.cos(rotation),
  };
}

function circle(
  id: string,
  x: number,
  z: number,
  radius: number,
): CircleCollider {
  return { kind: "circle", id, x, z, radius };
}

function box(
  id: string,
  x: number,
  z: number,
  halfWidth: number,
  halfDepth: number,
  rotation: number,
): BoxCollider {
  return { kind: "box", id, x, z, halfWidth, halfDepth, rotation };
}

function ellipse(
  id: string,
  x: number,
  z: number,
  radiusX: number,
  radiusZ: number,
): EllipseCollider {
  return { kind: "ellipse", id, x, z, radiusX, radiusZ };
}
