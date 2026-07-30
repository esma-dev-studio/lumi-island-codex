export interface EasyModeSettings {
  timingScale: number;
  fishingBiteSeconds: number;
  useFurigana: boolean;
}

export function easyModeSettings(enabled: boolean): EasyModeSettings {
  return enabled
    ? { timingScale: 1.55, fishingBiteSeconds: 2.1, useFurigana: true }
    : { timingScale: 1, fishingBiteSeconds: 1.25, useFurigana: true };
}

