export interface GroundVector {
  x: number;
  z: number;
}

const EPSILON = 0.000001;

export function cameraRelativeMovement(
  horizontal: number,
  forwardAmount: number,
  cameraForward: GroundVector,
): GroundVector {
  const forwardLength = Math.hypot(cameraForward.x, cameraForward.z);
  if (
    Math.abs(horizontal) < EPSILON &&
    Math.abs(forwardAmount) < EPSILON
  ) {
    return { x: 0, z: 0 };
  }

  const forward =
    forwardLength > EPSILON
      ? {
          x: cameraForward.x / forwardLength,
          z: cameraForward.z / forwardLength,
        }
      : { x: 0, z: -1 };
  const right = { x: forward.z, z: -forward.x };
  const movement = {
    x: right.x * horizontal + forward.x * forwardAmount,
    z: right.z * horizontal + forward.z * forwardAmount,
  };
  const length = Math.hypot(movement.x, movement.z);
  if (length <= 1) return movement;
  return { x: movement.x / length, z: movement.z / length };
}
