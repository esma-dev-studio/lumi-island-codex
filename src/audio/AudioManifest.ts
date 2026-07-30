import type { SoundName } from "@/src/audio/AudioSystem";

export interface ProceduralSoundDefinition {
  fromHz: number;
  toHz: number;
  duration: number;
  waveform: OscillatorType;
  gain: number;
}

export const AUDIO_MANIFEST: Record<SoundName, ProceduralSoundDefinition> = {
  ui: { fromHz: 420, toHz: 520, duration: 0.05, waveform: "sine", gain: 0.07 },
  pickup: { fromHz: 540, toHz: 820, duration: 0.11, waveform: "sine", gain: 0.07 },
  craft: { fromHz: 260, toHz: 620, duration: 0.18, waveform: "triangle", gain: 0.07 },
  place: { fromHz: 180, toHz: 280, duration: 0.12, waveform: "sine", gain: 0.07 },
  quest: { fromHz: 420, toHz: 880, duration: 0.32, waveform: "sine", gain: 0.07 },
  footstep: { fromHz: 95, toHz: 75, duration: 0.045, waveform: "triangle", gain: 0.025 },
  chop: { fromHz: 170, toHz: 95, duration: 0.1, waveform: "square", gain: 0.045 },
  tap: { fromHz: 530, toHz: 220, duration: 0.08, waveform: "triangle", gain: 0.05 },
  rustle: { fromHz: 720, toHz: 480, duration: 0.14, waveform: "sine", gain: 0.035 },
  splash: { fromHz: 190, toHz: 390, duration: 0.2, waveform: "sine", gain: 0.05 },
  bite: { fromHz: 620, toHz: 920, duration: 0.16, waveform: "square", gain: 0.045 },
  catch: { fromHz: 360, toHz: 960, duration: 0.28, waveform: "sine", gain: 0.07 },
};

