export interface FootstepCadenceResult {
  timer: number;
  shouldPlay: boolean;
}

export function advanceFootstepCadence(
  timer: number,
  deltaSeconds: number,
  moving: boolean,
  running: boolean,
  locked: boolean,
): FootstepCadenceResult {
  if (!moving || locked) {
    return { timer: 0, shouldPlay: false };
  }
  const remaining = timer - Math.max(0, deltaSeconds);
  if (remaining > 0) {
    return { timer: remaining, shouldPlay: false };
  }
  return {
    timer: running ? 0.24 : 0.36,
    shouldPlay: true,
  };
}
