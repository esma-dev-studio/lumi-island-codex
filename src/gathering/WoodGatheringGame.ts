import type { TimingGrade } from "@/src/gathering/TimingGatheringGame";

export interface WoodGatheringState {
  hits: TimingGrade[];
  requiredHits: 3;
}

export function createWoodGathering(): WoodGatheringState {
  return { hits: [], requiredHits: 3 };
}

export function recordWoodHit(
  state: WoodGatheringState,
  grade: TimingGrade,
): WoodGatheringState {
  if (state.hits.length >= state.requiredHits) return state;
  return { ...state, hits: [...state.hits, grade] };
}

export function woodReward(state: WoodGatheringState): {
  amount: number;
  grade: "normal" | "good" | "excellent";
} {
  const successful = state.hits.filter((grade) => grade !== "normal").length;
  const great = state.hits.filter((grade) => grade === "great").length;
  if (great === state.requiredHits) return { amount: 3, grade: "excellent" };
  if (successful >= 1) return { amount: 2, grade: "good" };
  return { amount: 1, grade: "normal" };
}
