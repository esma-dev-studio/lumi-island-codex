export type FishingJourneyPhase =
  | "aim"
  | "waiting"
  | "nibble"
  | "bite"
  | "reeling"
  | "caught"
  | "missed";

export interface FishingJourneyState {
  phase: FishingJourneyPhase;
  elapsed: number;
  shadow: number;
  biteAt: number;
  biteWindow: number;
  reelProgress: number;
  reelTarget: number;
}

export function createFishingJourney(
  easyMode: boolean,
  randomValue = Math.random(),
  habitat: "pond" | "harbor" = "pond",
): FishingJourneyState {
  const normalized = Math.max(0, Math.min(0.999, randomValue));
  return {
    phase: "aim",
    elapsed: 0,
    shadow: Math.floor(normalized * 3),
    biteAt: 2.2 + normalized * 1.4,
    biteWindow: easyMode
      ? habitat === "harbor"
        ? 1.8
        : 2.1
      : habitat === "harbor"
        ? 1
        : 1.25,
    reelProgress: 0,
    reelTarget: (easyMode ? 1 : 2) + (habitat === "harbor" ? 1 : 0),
  };
}

export function castFishingLine(
  state: FishingJourneyState,
  target: number,
): FishingJourneyState {
  if (state.phase !== "aim") return state;
  if (target !== state.shadow) {
    return { ...state, phase: "missed" };
  }
  return { ...state, phase: "waiting", elapsed: 0 };
}

export function advanceFishingJourney(
  state: FishingJourneyState,
  deltaSeconds: number,
): FishingJourneyState {
  if (
    state.phase === "aim" ||
    state.phase === "caught" ||
    state.phase === "missed" ||
    state.phase === "reeling"
  ) {
    return state;
  }
  const elapsed = state.elapsed + Math.max(0, deltaSeconds);
  const nibbleAt = Math.max(0.5, state.biteAt - 0.75);
  if (elapsed > state.biteAt + state.biteWindow) {
    return { ...state, phase: "missed", elapsed };
  }
  if (elapsed >= state.biteAt) {
    return { ...state, phase: "bite", elapsed };
  }
  if (elapsed >= nibbleAt) {
    return { ...state, phase: "nibble", elapsed };
  }
  return { ...state, phase: "waiting", elapsed };
}

export function pullFishingLine(
  state: FishingJourneyState,
): FishingJourneyState {
  if (state.phase === "bite") {
    return { ...state, phase: "reeling", reelProgress: 0 };
  }
  if (state.phase !== "reeling") {
    return { ...state, phase: "missed" };
  }
  const reelProgress = state.reelProgress + 1;
  return {
    ...state,
    reelProgress,
    phase: reelProgress >= state.reelTarget ? "caught" : "reeling",
  };
}
