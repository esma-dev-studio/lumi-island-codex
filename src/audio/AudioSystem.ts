export type SoundName =
  | "ui"
  | "pickup"
  | "craft"
  | "place"
  | "quest"
  | "footstep";

let context: AudioContext | null = null;

export function playSound(name: SoundName): void {
  if (typeof window === "undefined") return;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const values: Record<SoundName, [number, number, number]> = {
    ui: [420, 520, 0.05],
    pickup: [540, 820, 0.11],
    craft: [260, 620, 0.18],
    place: [180, 280, 0.12],
    quest: [420, 880, 0.32],
    footstep: [95, 75, 0.045],
  };
  const [from, to, duration] = values[name];
  oscillator.type = name === "footstep" ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
  gain.gain.setValueAtTime(name === "footstep" ? 0.025 : 0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
