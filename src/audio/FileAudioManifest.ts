import type { FileSoundName } from "@/src/audio/FileAudioSystem";

export interface AudioAssetDefinition {
  src: string;
  gain: number;
  category: "effects" | "ui";
}

const root = "/assets/audio/cc0-sfx-100-v2";

export const FILE_AUDIO_MANIFEST: Record<
  FileSoundName,
  AudioAssetDefinition
> = {
  ui: { src: `${root}/ui-confirm.ogg`, gain: 0.42, category: "ui" },
  cancel: { src: `${root}/ui-cancel.ogg`, gain: 0.36, category: "ui" },
  pickup: { src: `${root}/pickup.ogg`, gain: 0.4, category: "effects" },
  craft: { src: `${root}/craft.ogg`, gain: 0.34, category: "effects" },
  place: { src: `${root}/place.ogg`, gain: 0.34, category: "effects" },
  quest: { src: `${root}/quest.ogg`, gain: 0.38, category: "effects" },
  footstep: {
    src: `${root}/footstep-grass.ogg`,
    gain: 0.18,
    category: "effects",
  },
  chop: { src: `${root}/wood-hit.ogg`, gain: 0.42, category: "effects" },
  tap: { src: `${root}/stone-hit.ogg`, gain: 0.4, category: "effects" },
  rustle: { src: `${root}/forage.ogg`, gain: 0.28, category: "effects" },
  splash: { src: `${root}/water.ogg`, gain: 0.3, category: "effects" },
  bite: { src: `${root}/fish-bite.ogg`, gain: 0.4, category: "effects" },
  catch: { src: `${root}/pickup.ogg`, gain: 0.46, category: "effects" },
};
