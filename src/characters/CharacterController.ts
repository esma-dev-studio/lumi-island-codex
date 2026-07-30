import type { AnimationName, Position2D } from "@/src/game/types";

export interface CharacterMotion {
  velocity: Position2D;
  facing: number;
  animation: AnimationName;
  speed: number;
}

export interface CharacterControllerOptions {
  walkSpeed: number;
  runSpeed: number;
  acceleration: number;
  turnSpeed: number;
}

const DEFAULTS: CharacterControllerOptions = {
  walkSpeed: 3.8,
  runSpeed: 6.2,
  acceleration: 8,
  turnSpeed: 10,
};

export class CharacterController {
  private velocity: Position2D = { x: 0, z: 0 };
  private facing = Math.PI;
  private interaction: AnimationName | null = null;

  constructor(private readonly options = DEFAULTS) {}

  setFacing(rotation: number): void {
    this.facing = rotation;
  }

  setInteraction(animation: AnimationName | null): void {
    this.interaction = animation;
  }

  update(
    input: Position2D,
    running: boolean,
    deltaSeconds: number,
  ): CharacterMotion {
    const length = Math.hypot(input.x, input.z);
    const normalized =
      length > 0.0001
        ? { x: input.x / length, z: input.z / length }
        : { x: 0, z: 0 };
    const targetSpeed = running
      ? this.options.runSpeed
      : this.options.walkSpeed;
    const blend = Math.min(1, deltaSeconds * this.options.acceleration);
    this.velocity.x +=
      (normalized.x * targetSpeed - this.velocity.x) * blend;
    this.velocity.z +=
      (normalized.z * targetSpeed - this.velocity.z) * blend;

    if (length > 0.0001) {
      const targetFacing = Math.atan2(normalized.x, normalized.z);
      const difference = Math.atan2(
        Math.sin(targetFacing - this.facing),
        Math.cos(targetFacing - this.facing),
      );
      this.facing +=
        difference * Math.min(1, deltaSeconds * this.options.turnSpeed);
    } else {
      const damping = Math.max(0, 1 - deltaSeconds * this.options.acceleration);
      this.velocity.x *= damping;
      this.velocity.z *= damping;
    }
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const animation =
      this.interaction ??
      (length > 0.0001 ? (running ? "run" : "walk") : "idle");
    return {
      velocity: { ...this.velocity },
      facing: this.facing,
      animation,
      speed,
    };
  }

  stop(): void {
    this.velocity = { x: 0, z: 0 };
  }
}
