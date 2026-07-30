import {
  TUTORIAL_STEPS,
  type TutorialEvent,
} from "@/src/tutorial/TutorialSteps";
import type { GameState } from "@/src/game/types";

export interface TutorialProgress {
  step: number;
  walkedDistance: number;
}

export function createTutorialProgress(step = 0): TutorialProgress {
  return { step, walkedDistance: 0 };
}

export function applyTutorialEvent(
  progress: TutorialProgress,
  event: TutorialEvent,
): TutorialProgress {
  if (progress.step >= TUTORIAL_STEPS.length) return progress;
  const active = TUTORIAL_STEPS[progress.step];
  if (active.id === "move" && event.type === "move") {
    const walkedDistance = progress.walkedDistance + Math.max(0, event.distance);
    return walkedDistance >= 3
      ? { step: progress.step + 1, walkedDistance }
      : { ...progress, walkedDistance };
  }
  if (active.id === event.type) {
    return { ...progress, step: progress.step + 1 };
  }
  return progress;
}

export function resetTutorial(): TutorialProgress {
  return createTutorialProgress();
}

export function applyTutorialEventToState(
  state: GameState,
  event: TutorialEvent,
): GameState {
  const tutorialProgress = applyTutorialEvent(state.tutorialProgress, event);
  if (tutorialProgress === state.tutorialProgress) return state;
  return {
    ...state,
    tutorialProgress,
    tutorialStep: tutorialProgress.step,
  };
}
