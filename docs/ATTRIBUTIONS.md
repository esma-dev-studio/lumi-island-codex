# Phase 2 asset attributions

Lumi Island Phase 2 does not ship third-party character, texture, music, or
sound-effect assets.

## Character concept sheet

- Asset: `public/assets/characters/phase2-character-turnaround.png`
- Author: OpenAI ImageGen, directed and selected for this project
- Source URL: not applicable; generated specifically for Lumi Island
- License: original project asset under the same terms as this repository
- Modifications: used as the visual reference for silhouette, colors, clothing,
  and the animal resident's distinguishing features
- Production use: reference image only; it is not copied onto the 3D model

## Character GLB files

- Assets: `mira.glb`, `nolla.glb`, `kai.glb`, `sera.glb`
- Author: original procedural modeling and animation code in
  `scripts/generate_character_glbs.py`
- Source URL: not applicable
- License: original project assets under the same terms as this repository
- Modifications: generated as skinned GLB 2.0 models with original meshes,
  materials, skeletons, and nine animation clips
- Production use: yes

## Sound effects

- Pack: `100 CC0 SFX #2`
- Author: rubberduck
- Source: https://opengameart.org/content/100-cc0-sfx-2
- License: CC0 1.0
- Modifications: selected sounds were renamed by action and copied as OGG
  files under `public/assets/audio/cc0-sfx-100-v2/`; playback gain is adjusted
  by `src/audio/FileAudioManifest.ts`
- Production use: yes, for UI, pickup, crafting, placement, requests,
  footsteps, wood, stone, foraging, water, fish bite, and catch actions

The earlier oscillator-based sound implementation was removed in Phase 2.1.

## Social sharing image

- Asset: `public/og.png`
- Author: OpenAI ImageGen, directed and selected for this project
- Source URL: not applicable; generated specifically for Lumi Island
- Modifications: center-cropped and resized to 1200 x 630 pixels
- Production use: social preview metadata only
