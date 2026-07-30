export interface EasyModeSettings {
  timingScale: number;
  fishingBiteSeconds: number;
  useFurigana: boolean;
  showKeyboardLetters: boolean;
  buttonScale: number;
  guideGlow: boolean;
  dialogueMinimumSeconds: number;
}

export function easyModeSettings(enabled: boolean): EasyModeSettings {
  return enabled
    ? {
        timingScale: 1.55,
        fishingBiteSeconds: 2.1,
        useFurigana: true,
        showKeyboardLetters: false,
        buttonScale: 1.14,
        guideGlow: true,
        dialogueMinimumSeconds: 1.4,
      }
    : {
        timingScale: 1,
        fishingBiteSeconds: 1.25,
        useFurigana: true,
        showKeyboardLetters: true,
        buttonScale: 1,
        guideGlow: false,
        dialogueMinimumSeconds: 0,
      };
}
