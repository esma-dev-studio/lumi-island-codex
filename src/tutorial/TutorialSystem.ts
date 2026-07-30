import {
  TUTORIAL_FURNITURE_ID,
  TUTORIAL_RESIDENT_ID,
  TUTORIAL_STEPS,
  TUTORIAL_TREE_SOURCE_ID,
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

function matchesTutorialTarget(event: TutorialEvent): boolean {
  if (event.type === "hint") {
    return event.sourceId === TUTORIAL_TREE_SOURCE_ID && event.item === "wood";
  }
  if (event.type === "gather") {
    return event.sourceId === TUTORIAL_TREE_SOURCE_ID && event.item === "wood";
  }
  if (event.type === "craft" || event.type === "place") {
    return event.item === TUTORIAL_FURNITURE_ID;
  }
  if (event.type === "talk") {
    return event.resident === TUTORIAL_RESIDENT_ID;
  }
  return true;
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
  if (active.id === event.type && matchesTutorialTarget(event)) {
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