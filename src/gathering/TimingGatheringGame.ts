export type TimingGrade = "normal" | "good" | "great";

export interface TimingWindow {
  goodStart: number;
  goodEnd: number;
  greatStart: number;
  greatEnd: number;
}

export interface TimingGameConfig {
  durationSeconds: number;
  window: TimingWindow;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function timingConfig(
  activity: "wood" | "stone",
  easyMode: boolean,
): TimingGameConfig {
  const center = activity === "wood" ? 0.58 : 0.46;
  const goodHalf = easyMode ? 0.25 : activity === "wood" ? 0.18 : 0.14;
  const greatHalf = easyMode ? 0.11 : activity === "wood" ? 0.075 : 0.055;
  return {
    durationSeconds: activity === "wood" ? 2.8 : 2.05,
    window: {
      goodStart: clamp01(center - goodHalf),
      goodEnd: clamp01(center + goodHalf),
      greatStart: clamp01(center - greatHalf),
      greatEnd: clamp01(center + greatHalf),
    },
  };
}

export function timingProgress(
  elapsedSeconds: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  const cycle = (elapsedSeconds / durationSeconds) % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}

export function judgeTiming(
  progress: number,
  window: TimingWindow,
): TimingGrade {
  if (progress >= window.greatStart && progress <= window.greatEnd) {
    return "great";
  }
  if (progress >= window.goodStart && progress <= window.goodEnd) {
    return "good";
  }
  return "normal";
}

