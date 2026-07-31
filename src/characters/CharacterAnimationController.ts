import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { Scene } from "@babylonjs/core/scene";
import type { AnimationName } from "@/src/game/types";
import type { CharacterConfig } from "@/src/characters/CharacterConfig";
import { resolveAnimationName } from "@/src/characters/CharacterConfig";

const LOOPING = new Set<AnimationName>(["idle", "walk", "run", "talk"]);

export class CharacterAnimationController {
  private readonly groups = new Map<string, AnimationGroup>();
  private current: AnimationGroup | null = null;
  private currentName: AnimationName | null = null;
  private blendObserver: Observer<Scene> | null = null;
  private returnObserver: Observer<AnimationGroup> | null = null;
  private blinkTimer = 2.5;
  private disposed = false;

  constructor(
    private readonly scene: Scene,
    animationGroups: AnimationGroup[],
    private readonly config: CharacterConfig,
  ) {
    animationGroups.forEach((group) => {
      group.stop();
      this.groups.set(group.name, group);
      group.targetedAnimations.forEach(({ animation }) => {
        animation.enableBlending = true;
        animation.blendingSpeed = 0.08;
      });
    });
  }

  play(name: AnimationName, speed = 1, force = false): void {
    if (this.disposed || name === "blink") return;
    if (!force && this.currentName === name) {
      if (this.current) this.current.speedRatio = speed;
      return;
    }
    const next = this.groups.get(resolveAnimationName(this.config, name));
    if (!next) return;
    const previous = this.current;
    if (this.blendObserver) {
      this.scene.onBeforeRenderObservable.remove(this.blendObserver);
      this.blendObserver = null;
    }
    if (this.returnObserver && this.current) {
      this.current.onAnimationGroupEndObservable.remove(this.returnObserver);
      this.returnObserver = null;
    }
    next.stop();
    next.start(LOOPING.has(name), speed);
    next.setWeightForAllAnimatables(previous ? 0 : 1);
    this.current = next;
    this.currentName = name;

    if (previous && previous !== next) {
      let blend = 0;
      this.blendObserver = this.scene.onBeforeRenderObservable.add(() => {
        blend = Math.min(
          1,
          blend + this.scene.getEngine().getDeltaTime() / 180,
        );
        next.setWeightForAllAnimatables(blend);
        previous.setWeightForAllAnimatables(1 - blend);
        if (blend >= 1 && this.blendObserver) {
          previous.stop();
          this.scene.onBeforeRenderObservable.remove(this.blendObserver);
          this.blendObserver = null;
        }
      });
    }

    if (!LOOPING.has(name)) {
      this.returnObserver = next.onAnimationGroupEndObservable.addOnce(() => {
        this.returnObserver = null;
        this.play("idle", 1, true);
      });
    }
  }

  update(deltaSeconds: number): void {
    if (this.disposed) return;
    this.blinkTimer -= deltaSeconds;
    if (this.blinkTimer > 0) return;
    this.blinkTimer = 3.2 + Math.random() * 2.4;
    const blink = this.groups.get(this.config.expressionMappings.blinkAnimation);
    if (!blink) return;
    blink.stop();
    blink.start(false, 1);
  }

  playBlink(): void {
    const blink = this.groups.get(this.config.expressionMappings.blinkAnimation);
    if (!blink) return;
    blink.stop();
    blink.start(false, 1);
  }

  dispose(): void {
    this.disposed = true;
    if (this.blendObserver) {
      this.scene.onBeforeRenderObservable.remove(this.blendObserver);
    }
    if (this.returnObserver && this.current) {
      this.current.onAnimationGroupEndObservable.remove(this.returnObserver);
    }
    this.groups.forEach((group) => {
      group.stop();
      group.dispose();
    });
    this.groups.clear();
  }
}
