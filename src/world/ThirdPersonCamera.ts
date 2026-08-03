export interface CameraTargetPoint {
  x: number;
  y: number;
  z: number;
}

export const THIRD_PERSON_CAMERA = Object.freeze({
  alpha: -Math.PI / 4,
  beta: 1.02,
  radius: 11.5,
  minimumRadius: 8.5,
  maximumRadius: 16,
  minimumBeta: 0.78,
  maximumBeta: 1.24,
  fov: 0.72,
  targetHeight: 1.15,
  followSpeed: 6,
});

export function thirdPersonCameraTarget(
  position: CameraTargetPoint,
): CameraTargetPoint {
  return {
    x: position.x,
    y: position.y + THIRD_PERSON_CAMERA.targetHeight,
    z: position.z,
  };
}

export function estimatedCharacterScreenCoverage(
  characterHeight: number,
): number {
  const visibleWorldHeight =
    2 * THIRD_PERSON_CAMERA.radius * Math.tan(THIRD_PERSON_CAMERA.fov / 2);
  return characterHeight / visibleWorldHeight;
}
