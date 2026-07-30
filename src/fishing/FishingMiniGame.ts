export type FishingPhase = "waiting" | "bite" | "caught" | "missed";

export interface FishingGameState {
  phase: FishingPhase;
  elapsed: number;
  biteAt: number;
  biteWindow: number;
}

export function createFishingGame(
  easyMode: boolean,
  randomValue = Math.random(),
): FishingGameState {
  return {
    phase: "waiting",
    elapsed: 0,
    biteAt: 1.8 + Math.max(0, Math.min(1, randomValue)) * 1.9,
    biteWindow: easyMode ? 2.1 : 1.25,
  };
}

export function advanceFishingGame(
  state: FishingGameState,
  deltaSeconds: number,
): FishingGameState {
  if (state.phase === "caught" || state.phase === "missed") return state;
  const elapsed = state.elapsed + Math.max(0, deltaSeconds);
  if (state.phase === "waiting" && elapsed >= state.biteAt) {
    if (elapsed > state.biteAt + state.biteWindow) {
      return { ...state, phase: "missed", elapsed };
    }
    return { ...state, phase: "bite", elapsed };
  }
  if (
    state.phase === "bite" &&
    elapsed > state.biteAt + state.biteWindow
  ) {
    return { ...state, phase: "missed", elapsed };
  }
  return { ...state, elapsed };
}

export function tryCatchFish(state: FishingGameState): FishingGameState {
  return {
    ...state,
    phase: state.phase === "bite" ? "caught" : "missed",
  };
}

