export interface Point2D {
  x: number;
  z: number;
}

export function targetOccluderVisibility(
  camera: Point2D,
  player: Point2D,
  occluder: Point2D,
): number {
  const segmentX = player.x - camera.x;
  const segmentZ = player.z - camera.z;
  const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
  const projection =
    segmentLengthSquared > 0.0001
      ? ((occluder.x - camera.x) * segmentX +
          (occluder.z - camera.z) * segmentZ) /
        segmentLengthSquared
      : 0;
  const closestX = camera.x + segmentX * projection;
  const closestZ = camera.z + segmentZ * projection;
  const distanceToViewLine = Math.hypot(
    occluder.x - closestX,
    occluder.z - closestZ,
  );
  const shouldFade =
    projection > 0.08 &&
    projection < 0.92 &&
    distanceToViewLine < 1.45 &&
    Math.hypot(occluder.x - player.x, occluder.z - player.z) > 1.2;
  return shouldFade ? 0.28 : 1;
}

export function smoothVisibility(
  current: number,
  target: number,
  deltaSeconds: number,
): number {
  return current + (target - current) * Math.min(1, deltaSeconds * 8);
}