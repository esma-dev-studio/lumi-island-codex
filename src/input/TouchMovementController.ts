import { sendGameKey } from "@/src/player/PlayerInputController";

export type TouchDirectionKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight";

export class TouchMovementController {
  private readonly pressed = new Set<TouchDirectionKey>();

  constructor(private readonly dispatch = sendGameKey) {}

  press(key: TouchDirectionKey): void {
    if (this.pressed.has(key)) return;
    this.pressed.add(key);
    this.dispatch(key, true);
  }

  release(key: TouchDirectionKey): void {
    if (!this.pressed.delete(key)) return;
    this.dispatch(key, false);
  }

  releaseAll(): void {
    [...this.pressed].forEach((key) => this.dispatch(key, false));
    this.pressed.clear();
  }

  isPressed(key: TouchDirectionKey): boolean {
    return this.pressed.has(key);
  }
}