import type { AudioSettings } from "@/src/game/types";
import type { WorldZoneId } from "@/src/world/WorldZones";

export interface ZoneAmbientProfile {
  noiseFilter: BiquadFilterType;
  noiseFrequency: number;
  toneFrequency: number;
  toneWave: OscillatorType;
  gain: number;
}

export const ZONE_AMBIENT_PROFILES: Record<WorldZoneId, ZoneAmbientProfile> = {
  meadow: {
    noiseFilter: "bandpass",
    noiseFrequency: 2800,
    toneFrequency: 523.25,
    toneWave: "sine",
    gain: 0.032,
  },
  forest: {
    noiseFilter: "lowpass",
    noiseFrequency: 920,
    toneFrequency: 174.61,
    toneWave: "sine",
    gain: 0.038,
  },
  harbor: {
    noiseFilter: "bandpass",
    noiseFrequency: 420,
    toneFrequency: 261.63,
    toneWave: "triangle",
    gain: 0.045,
  },
  "moon-garden": {
    noiseFilter: "highpass",
    noiseFrequency: 1800,
    toneFrequency: 293.66,
    toneWave: "sine",
    gain: 0.026,
  },
};

interface AmbientNodes {
  source: AudioBufferSourceNode;
  tone: OscillatorNode;
  lfo: OscillatorNode;
  master: GainNode;
}

let context: AudioContext | null = null;
let activeNodes: AmbientNodes | null = null;
let activeZone: WorldZoneId | null = null;
let settings: AudioSettings = { muted: false, effectsVolume: 0.72 };
let visibilityBound = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (!visibilityBound) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityBound = true;
  }
  return context;
}

function handleVisibilityChange(): void {
  if (!context) return;
  if (document.hidden) {
    void context.suspend();
  } else if (!settings.muted) {
    void context.resume();
  }
}

function noiseBuffer(audioContext: AudioContext): AudioBuffer {
  const seconds = 4;
  const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * seconds,
    audioContext.sampleRate,
  );
  const channel = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < channel.length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.985 + white * 0.015;
    channel[index] = previous;
  }
  return buffer;
}

function stopCurrent(fadeSeconds = 0.4): void {
  if (!activeNodes || !context) return;
  const now = context.currentTime;
  activeNodes.master.gain.cancelScheduledValues(now);
  activeNodes.master.gain.setValueAtTime(activeNodes.master.gain.value, now);
  activeNodes.master.gain.linearRampToValueAtTime(0, now + fadeSeconds);
  const oldNodes = activeNodes;
  window.setTimeout(() => {
    oldNodes.source.stop();
    oldNodes.tone.stop();
    oldNodes.lfo.stop();
    oldNodes.master.disconnect();
  }, (fadeSeconds + 0.1) * 1000);
  activeNodes = null;
}

function start(zone: WorldZoneId): void {
  const audioContext = getContext();
  if (!audioContext) return;
  const profile = ZONE_AMBIENT_PROFILES[zone];
  const master = audioContext.createGain();
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const tone = audioContext.createOscillator();
  const toneGain = audioContext.createGain();
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();

  noise.buffer = noiseBuffer(audioContext);
  noise.loop = true;
  filter.type = profile.noiseFilter;
  filter.frequency.value = profile.noiseFrequency;
  filter.Q.value = 0.55;
  tone.type = profile.toneWave;
  tone.frequency.value = profile.toneFrequency;
  toneGain.gain.value = 0.07;
  lfo.frequency.value = zone === "harbor" ? 0.12 : 0.08;
  lfoGain.gain.value = 0.025;
  lfo.connect(lfoGain);
  lfoGain.connect(toneGain.gain);

  noise.connect(filter);
  filter.connect(master);
  tone.connect(toneGain);
  toneGain.connect(master);
  master.connect(audioContext.destination);
  master.gain.value = 0;
  const target = settings.muted ? 0 : profile.gain * settings.effectsVolume;
  master.gain.linearRampToValueAtTime(target, audioContext.currentTime + 0.65);
  noise.start();
  tone.start();
  lfo.start();
  activeNodes = { source: noise, tone, lfo, master };
  if (!settings.muted) void audioContext.resume();
}

export function configureZoneAmbientAudio(next: AudioSettings): void {
  settings = { ...next, effectsVolume: Math.max(0, Math.min(1, next.effectsVolume)) };
  if (!activeNodes || !context || !activeZone) return;
  const target = settings.muted
    ? 0
    : ZONE_AMBIENT_PROFILES[activeZone].gain * settings.effectsVolume;
  activeNodes.master.gain.setTargetAtTime(target, context.currentTime, 0.12);
}

export function setAmbientZone(zone: WorldZoneId): void {
  if (zone === activeZone && activeNodes) return;
  activeZone = zone;
  stopCurrent();
  start(zone);
}

export function disposeZoneAmbientAudio(): void {
  stopCurrent(0.05);
  if (visibilityBound && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  visibilityBound = false;
  activeZone = null;
  if (context) void context.close();
  context = null;
}
