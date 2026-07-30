import { AUDIO_MANIFEST } from "@/src/audio/AudioManifest";

export type SoundName =
  | "ui"
  | "pickup"
  | "craft"
  | "place"
  | "quest"
  | "footstep"
  | "chop"
  | "tap"
  | "rustle"
  | "splash"
  | "bite"
  | "catch";

let context: AudioContext | null = null;

export function playSound(name: SoundName): void {
  if (typeof window === "undefined") return;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const sound = AUDIO_MANIFEST[name];
  oscillator.type = sound.waveform;
  oscillator.frequency.setValueAtTime(sound.fromHz, now);
  oscillator.frequency.exponentialRampToValueAtTime(sound.toHz, now + sound.duration);
  gain.gain.setValueAtTime(sound.gain, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + sound.duration);
}
