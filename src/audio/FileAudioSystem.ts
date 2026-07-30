import { FILE_AUDIO_MANIFEST } from "@/src/audio/FileAudioManifest";
import type { AudioSettings } from "@/src/game/types";

export type FileSoundName =
  | "ui"
  | "cancel"
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
let settings: AudioSettings = { muted: false, effectsVolume: 0.72 };
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function loadBuffer(src: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(src);
  if (cached) return cached;
  const pending = (async () => {
    try {
      const audioContext = getContext();
      if (!audioContext) return null;
      const response = await fetch(src);
      if (!response.ok) return null;
      return await audioContext.decodeAudioData(await response.arrayBuffer());
    } catch {
      return null;
    }
  })();
  buffers.set(src, pending);
  return pending;
}

export function configureAudio(next: AudioSettings): void {
  settings = {
    muted: next.muted,
    effectsVolume: Math.max(0, Math.min(1, next.effectsVolume)),
  };
}

export function preloadAudio(): void {
  if (typeof window === "undefined") return;
  Object.values(FILE_AUDIO_MANIFEST).forEach((asset) => {
    void loadBuffer(asset.src);
  });
}

export function playSound(name: FileSoundName): void {
  if (settings.muted || settings.effectsVolume <= 0) return;
  const audioContext = getContext();
  if (!audioContext) return;
  const asset = FILE_AUDIO_MANIFEST[name];
  void loadBuffer(asset.src).then((buffer) => {
    if (!buffer || settings.muted || !context) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = asset.gain * settings.effectsVolume;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  });
}

export function disposeAudio(): void {
  buffers.clear();
  if (context) void context.close();
  context = null;
}
