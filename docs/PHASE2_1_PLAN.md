# Lumi Island Phase 2.1 implementation plan

## Scope and completion policy

The existing game, movement, collision, placement, pause, and saves will be preserved. Work proceeds immediately after this plan. A gate is reported complete only when its acceptance conditions and tests pass.

## 1. Event-driven tutorial

- Problem: the blocking tutorial advances on button clicks.
- Root cause: tutorial progress is UI-local and does not consume game events.
- Files: `src/tutorial/*`, `src/ui/LumiIslandApp.tsx`, `src/ui/GameCanvas.tsx`.
- Implementation: add typed tutorial steps and a reducer that observes movement distance, interaction hint, activity completion, inventory open, craft, placement, and NPC conversation.
- Test: unit tests for every transition plus Playwright coverage for walking and gathering.
- Existing impact: pause no longer includes the tutorial; the game stays playable.
- Risk: accidental double progression; prevent with one active condition at a time.
- Done when: clicks alone cannot advance and replay resets safely.

## 2. Shared resource state and visuals

- Problem: React, the scene, and the save use different resource state.
- Root cause: `GameCanvas` never synchronizes `resourceStates`.
- Files: `src/resources/*`, `src/scenes/LumiScenes.ts`, `src/ui/GameCanvas.tsx`, `src/game/types.ts`, `src/save/SaveSystem.ts`.
- Implementation: introduce a versioned `ResourceState`, one transition system, scene synchronization, non-destructive depleted visuals, and play-time recovery.
- Test: depletion, cooldown, recovery, migration, scene sync hook, and reload E2E.
- Existing impact: old saves migrate to safe available states.
- Risk: tutorial resource unavailable; mark a guaranteed tutorial tree and keep several sources.
- Done when: the same state drives rewards, visuals, interaction, save, and restore.

## 3. Distinct activities and animation coordination

- Problem: wood and stone feel identical; animation and reward timing are disconnected.
- Root cause: a shared one-hit timing overlay commits directly to inventory.
- Files: `src/activities/*`, `src/gathering/*`, `src/fishing/*`, `src/ui/minigames/*`, `src/scenes/LumiScenes.ts`.
- Implementation: wood becomes three rhythmic hits, stone becomes a crack-selection game, forage remains discovery-led, and fishing gains cast, fake nibble, bite, and reel phases. All return one `ActivityResult`; the scene plays the matching action and target reaction before the reward commit.
- Test: deterministic reducers and activity-result tests plus E2E for each unique UI.
- Existing impact: guaranteed minimum reward prevents child frustration.
- Risk: timing flakiness; expose deterministic debug hooks only in development/E2E.
- Done when: the four actions look and play differently and result order is testable.

## 4. Easy mode and collection

- Problem: easy mode is mostly timing; collection copy points to a missing screen.
- Root cause: settings and discoveries are stored but not rendered as product features.
- Files: `src/accessibility/*`, `src/collection/*`, `src/ui/LumiIslandApp.tsx`, scoped CSS.
- Implementation: central easy-copy/settings helpers, larger controls, simpler labels, ruby, stronger guidance, and a 12-entry collection with silhouettes, location/time hints, count, and category completion.
- Test: settings/copy unit tests, automatic registration, completion rate, save/load, and screenshot comparison.
- Existing impact: existing discovery arrays migrate into collection records.
- Risk: HUD clutter; collection remains a menu panel and the tutorial shows one instruction only.
- Done when: normal/easy screenshots differ clearly and every collection promise opens a real screen.

## 5. Audio

- Problem: all sounds are oscillator prototypes.
- Root cause: no audio asset manifest or buffer playback path.
- Files: `public/assets/audio/*`, `src/audio/*`, `docs/ATTRIBUTIONS.md`.
- Implementation: add small licensed or original audio files, cached buffer playback, effects volume, mute, and distinct wood/stone/footstep/UI sounds.
- Test: manifest validation, settings test, and browser requests without console errors.
- Existing impact: sound remains optional and safe when browser autoplay is blocked.
- Risk: unavailable licensed source; if so, mark audio incomplete instead of claiming final quality.
- Done when: main actions use files and attribution is complete.

## 6. Code split, E2E, and release

- Problem: two application files and the global stylesheet carry several large responsibilities.
- Root cause: Phase 1 and 2 features accumulated in the first scene and shell.
- Files: scene resource builder/reaction modules, tutorial, collection, activities, accessibility, scoped CSS, `e2e/*`, Playwright config.
- Implementation: extract responsibilities without rewriting the working scene; add stable `data-testid`/development hooks only where semantic selectors cannot drive WebGL.
- Test: typecheck, lint, all Vitest, Playwright, production build, console scan, manual browser screenshots.
- Existing impact: preserve the current public route and save key.
- Risk: deployment bundle growth; keep assets small and verify the Worker archive before publishing.
- Done when: all checks pass, screenshots are reviewed, the exact commit is deployed, and the review ZIP is refreshed.

## Character gate

The environment has no Blender or 3D generation tool capable of delivering the requested 15k–35k triangle textured, smoothly weighted character. The current procedural GLB cannot pass this gate. Phase 2.1 will:

1. move the generator to an explicit fixture/fallback role;
2. harden GLB validation for UVs, textures, and multi-joint weights;
3. prepare an external authoring brief and replacement contract;
4. keep the current playable asset clearly marked as temporary;
5. complete all non-character quality gates.

The character gate remains open until an authored GLB passes the validator and visual review.
