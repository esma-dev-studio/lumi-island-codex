# Lumi Island Phase 2.2 independent audit

Date: 2026-07-30
Audited commit: `6e26067d19b92ca619351ad94f35ac7b82800ca6`

This audit was performed from the code, assets, a clean dependency install, fresh automated runs, and a new-game browser session. Existing Phase reports, screenshots, and claimed completion gates were treated only as historical context.

## Baseline verification

| Check | Independent result |
| --- | --- |
| `npm ci` | Completed from `package-lock.json`; npm reported 18 dependency advisories: 1 low, 4 moderate, 13 high |
| TypeScript | Pass |
| ESLint | Pass |
| Vitest | Pass: 4 files, 43 tests |
| Existing Playwright | Pass: 5 scenarios |
| Production build | Pass, with a client chunk larger than 500 kB |
| New game browser session | Started successfully; keyboard movement input is received by the canvas |
| Browser console monitoring | Existing five scenarios captured no page or console errors |
| GLB structural script | Passes all four procedural files under the old validator |
| Actual Mira GLB inspection | 4 meshes, 6 materials, 12 joints, 9 clips, 0 UV0 primitives, 0 textures, 0 images |

Passing the existing suite does not establish the Phase 2.2 acceptance conditions. The existing E2E uses mouse clicks for all activity actions and does not test the failures below.

## Findings

### A-01 — Activity controls advertise keys that have no activity handler

- **事象:** Wood and fishing show `E`, but `E` and `Space` are not handled by the activity overlay. Stone and fishing targets cannot be selected with arrow keys. Enter does not confirm.
- **再現手順:** Start an activity, move focus away from the button, then press the displayed key. In wood, the hit count does not advance. In stone, Left/Right does not move a selected crack. In fishing, Left/Right does not choose a shadow and E does not cast.
- **根本原因:** `ActivityOverlayPhase21.tsx` only wires `onClick`. It has no activity-level `keydown` listener or shared input controller.
- **影響:** A child following the visible keyboard instruction is blocked. Keyboard-only completion is impossible.
- **優先度:** P0
- **修正方法:** Add one modal activity input controller for E, Space, Enter, Escape, Tab, and arrows. Route actions according to the active phase and ignore repeated keydown events.
- **テスト方法:** Playwright completes wood, stone, and fishing without mouse clicks and asserts each phase transition.
- **完了条件:** Every displayed key works, no undisplayed key is required, and mouse/touch behavior remains available.

### A-02 — Focus and Escape behavior are not modal-safe

- **事象:** Activity start does not focus the first actionable control. Escape is handled by the app shell, not by the activity, and can open the pause menu behind or alongside the activity. Focus is not restored to the canvas on close.
- **再現手順:** Start wood with E, inspect `document.activeElement`, press Escape, then inspect the activity, menu, and active element.
- **根本原因:** The activity card has no dialog semantics, focus entry, focus restoration, or local Escape handler. The global app key handler remains active.
- **影響:** Keyboard input can be lost or processed by the wrong layer; children cannot reliably leave an activity.
- **優先度:** P0
- **修正方法:** Implement modal focus ownership, stop event propagation for handled keys, cancel with Escape, clear held scene keys, and restore canvas focus.
- **テスト方法:** Playwright asserts initial focus, Tab traversal, Escape close, canvas focus restoration, and no menu opening.
- **完了条件:** Exactly one UI layer receives an input and the canvas regains focus after activity completion or cancellation.

### A-03 — Player movement resumes during settlement animation

- **事象:** After the result button is pressed, the overlay closes immediately while the scene plays the gather animation. During this interval movement input is processed.
- **再現手順:** Complete wood, activate the result button, immediately hold an arrow key, and compare the player position before the reward settles.
- **根本原因:** `activity` becomes `null` in `queueActivityResult`, so `isPaused` becomes false. `pendingActivityResult` is not part of pause or movement-lock state. The scene has animation timers but no explicit `PlayerActionState`.
- **影響:** The character can slide while chopping, mining, picking up, or fishing; target reaction, animation, reward, and position lose visual coherence.
- **優先度:** P0
- **修正方法:** Add an explicit action state with prepare/animate/reward phases. Lock translation through settlement while allowing camera and safe Escape.
- **テスト方法:** Record canvas debug position before and during settlement; assert unchanged until reward and unlocked afterward.
- **完了条件:** Movement velocity remains zero for the entire action sequence and unlocks only after resource and reward state commit.

### A-04 — Activity sound and settlement order are only partially coordinated

- **事象:** Wood and stone sounds play on minigame input, before the scene turns the player, animates, and reacts to the target. Forage and fishing also trigger some sounds inside the overlay rather than at the world action point.
- **再現手順:** Trigger a wood hit and observe that the sound request occurs before the result is accepted and before the world animation begins.
- **根本原因:** `playSound` calls are distributed inside React activity panels while scene settlement owns animation and target reaction.
- **影響:** Audio does not consistently describe the visible action and the claimed action-result ordering is incomplete.
- **優先度:** P0
- **修正方法:** Move world-action sounds to activity settlement phases; keep only UI feedback sounds inside the minigame.
- **テスト方法:** Instrument audio requests and assert action sound occurs during animate, reward sound after reward.
- **完了条件:** The ordered sequence is target → face → minigame → lock → animation/reaction/sound → reward/resource state → unlock.

### A-05 — Tutorial events are not target-dependent

- **事象:** Any nearby interactable advances `hint`; any gathering result advances `gather`; any furniture craft/place and any resident conversation advance their matching step.
- **再現手順:** Seed or play to a tutorial step, approach a non-tree resource or resident, and trigger the generic event.
- **根本原因:** `TutorialEvent` only contains the event type. `applyTutorialEvent` compares `active.id === event.type` and has no source, item, furniture, or resident condition.
- **影響:** The tutorial can confirm the wrong action and then instruct the child from an invalid game state.
- **優先度:** P0
- **修正方法:** Add stable source/item/furniture/resident payloads and explicit conditions for the tutorial tree, wood reward, first craftable furniture, placed item, and Nolla.
- **テスト方法:** Unit tests reject wrong sources/items/residents and Playwright proves the next step does not advance.
- **完了条件:** Only the named world target and actual requested action advance each step.

### A-06 — “あとで” permanently completes the tutorial

- **事象:** Pressing “あとで” sets the tutorial step to the final index and persists that state.
- **再現手順:** Start a new game, press “あとで”, save/reload, and observe that the tutorial is gone.
- **根本原因:** `onDismiss` writes `TUTORIAL_STEPS.length` into saved tutorial progress.
- **影響:** A child who only wanted more screen space loses the guided path.
- **優先度:** P0
- **修正方法:** Store a session-only hidden flag. Add separately confirmed stop, resume, and restart actions in the menu.
- **テスト方法:** Hide, reopen from menu, reload, and verify persisted progress did not change.
- **完了条件:** Hide is temporary; stop is explicit and confirmed; resume/restart are available.

### A-07 — Multiple goals and excess HUD compete with the tutorial

- **事象:** New game simultaneously shows the normal quest card and tutorial goal, plus day/time, lumen, camera, menu, four tool buttons, and a desktop direction pad.
- **再現手順:** Start a new game at 1440×900 and inspect the accessibility tree or screenshot.
- **根本原因:** Quest ribbon and full top bar render independently of tutorial state. Touch controls have no coarse-pointer or setting condition.
- **影響:** The child sees two “what to do now” messages and unnecessary controls before learning movement.
- **優先度:** P0
- **修正方法:** Hide the quest ribbon while the tutorial is visible, simplify the top bar, move secondary progress into panels, and show the direction pad only for coarse pointers or an explicit setting.
- **テスト方法:** Desktop and touch-emulated screenshots plus visibility assertions.
- **完了条件:** Normal play keeps one goal, one nearby action, and bag/menu as the persistent essentials.

### A-08 — Easy mode is partly disconnected

- **事象:** Easy mode changes some text, CSS scale, timing, and fishing duration, but `buttonScale`, `guideGlow`, and `dialogueMinimumSeconds` are unused. `EasyText.ts` is unused. Dialogue remains two paragraphs at once.
- **再現手順:** Compare normal and easy DOM/text/game values and trace references to all `EasyModeSettings` fields.
- **根本原因:** Settings were defined independently from the HUD and activity presentation; only selected values were manually duplicated elsewhere.
- **影響:** The experience changes less than the menu promise and still presents difficult or simultaneous information.
- **優先度:** P0
- **修正方法:** Make one settings source drive copy, key visibility, target glow, timings, dialogue paging, and button size; use or remove `EasyText.ts`.
- **テスト方法:** Text-difference, computed-size, timing, glow, and one-sentence dialogue assertions.
- **完了条件:** Easy mode materially changes wording, guidance, input tolerance, and dialogue—not only a badge or scale.

### A-09 — Footstep audio is declared but never played

- **事象:** Movement updates `footstepTimer`, but the timer reset branch does not call `playSound("footstep")` or any audio callback.
- **再現手順:** Move or run while monitoring audio fetch/play requests; no new footstep request occurs.
- **根本原因:** Babylon scene cannot call the React audio module and no `onFootstep` callback exists.
- **影響:** The attribution and Phase 2.1 report imply a working footstep feature that does not exist.
- **優先度:** P1
- **修正方法:** Add a scene-to-app footstep callback tied to movement speed and action lock; use shorter cadence for running.
- **テスト方法:** Playwright instruments the audio request hook and distinguishes walk, run, stop, and locked states.
- **完了条件:** Walking and running request footsteps at different cadences; stopped/locked players do not.

### A-10 — Resource save IDs are derived from visual node names

- **事象:** `resourceTargets` is keyed by `target.node.name`, and the scene’s arrays and builders hardcode resource positions and names.
- **再現手順:** Rename a tree TransformNode and load a save containing its former name; the saved depleted state no longer maps to the visible tree.
- **根本原因:** The world has no single fixed `ResourceDefinition` with an explicit ID. The current `ResourceDefinitions.ts` only defines cooldowns by item type.
- **影響:** Visual refactors can respawn depleted resources or orphan old save entries.
- **優先度:** P1
- **修正方法:** Define every source once with stable ASCII ID, item, position, visual type, collider, radius, and cooldown. Generate visual/interactable/state/debug data from it and migrate legacy names.
- **テスト方法:** Rename-proof unit tests and a version-3-to-version-4 resource-state migration test.
- **完了条件:** No save key depends on a Babylon node name or Japanese display text.

### A-11 — Collection IDs and first-discovery logic are unstable

- **事象:** Several discovery IDs concatenate Japanese display names. `alreadyDiscovered` checks whether any ID starts with the resource category, so a second species in that category is shown as already known.
- **再現手順:** Discover one berry, then discover the other berry species; the second result is not treated as an individual first discovery.
- **根本原因:** Forage data has no stable per-entry ID and the overlay receives a category-prefix boolean.
- **影響:** Renaming copy breaks saves and weakens collection feedback.
- **優先度:** P1
- **修正方法:** Give every entry a stable ASCII ID, separate copy, and test exact ID membership. Add original coded thumbnails/silhouettes and milestone rewards.
- **テスト方法:** Unit test both species independently and E2E the second first-discovery notice.
- **完了条件:** Each species registers once by stable ID and collection progress unlocks at 25/50/75 percent.

### A-12 — Documentation and attribution sources contradict the implementation

- **事象:** `README.md` and root `ATTRIBUTIONS.md` are mojibake. Root attribution says no external assets, while the game ships a CC0 sound pack. `docs/ATTRIBUTIONS.md` calls procedural GLBs “Production use: yes” although the current limitation and brief call Mira temporary.
- **再現手順:** Open the four documentation sources side by side and compare them with `FileAudioManifest.ts` and the actual GLBs.
- **根本原因:** Phase documents were appended without replacing earlier source-of-truth files.
- **影響:** Reviewers cannot determine current controls, save version, licenses, or asset readiness.
- **優先度:** P1
- **修正方法:** Rewrite README, canonical attribution, current limitations, and Phase 2.2 report. Reduce root attribution to a pointer or remove it.
- **テスト方法:** Documentation checklist against code constants and packaged assets.
- **完了条件:** One unambiguous source states real controls, version 3 save, CC0 audio, and temporary procedural GLBs.

### A-13 — The GLB validator accepts assets that fail the character gate

- **事象:** All four GLBs pass the current validator despite having no UV0, image, or texture. The generator writes `(1,0,0,0)` weights for every vertex.
- **再現手順:** Run `scripts/validate_character_glbs.py`; then inspect `TEXCOORD_0`, textures/images, and generator line 739.
- **根本原因:** The validator checks only header, clip names, any skin, any mesh, and at least eight joints.
- **影響:** A temporary procedural model can be mistaken for a production-ready delivery.
- **優先度:** P1
- **修正方法:** Add UV, texture/image, required bone, normalized weight, multi-joint vertex, max-four influence, file size, triangle, material, and Khronos validation gates. Keep visual review mandatory.
- **テスト方法:** Current models must return a clearly labelled temporary/fail result; a deliberately malformed fixture must fail each rule.
- **完了条件:** No current procedural GLB can pass the production character gate.

### A-14 — Legacy code and integration facades remain

- **事象:** `CharacterFactory.ts`, `CharacterShowcase.tsx`, `FishingMiniGame.ts`, and `EasyText.ts` are unused in production. `LumiScenes.ts` is 1,744 lines, `LumiIslandApp.tsx` is 1,153 lines, and `globals.css` is 1,878 lines.
- **再現手順:** Trace imports with `rg` and count file lines.
- **根本原因:** New systems were added beside earlier implementations while the two integration facades retained world, input, HUD, panels, NPC, and showcase responsibilities.
- **影響:** Input ordering and world-state bugs are harder to reason about and tests can continue covering obsolete modules.
- **優先度:** P1
- **修正方法:** Remove genuinely unused sources and extract responsibility-based controllers/components/builders without artificial line splitting.
- **テスト方法:** Import search, typecheck, lint, Vitest, Playwright, and build after each extraction.
- **完了条件:** Production has one activity path, one easy-text path, and stable subsystem boundaries.

### A-15 — Existing screenshots and E2E overstate interaction coverage

- **事象:** The Phase 2.1 report counts 22 acceptance points, but the five tests click activity controls with a mouse, seed localStorage for most flows, do not assert focus or audio, and do not run a complete new-game tutorial.
- **再現手順:** Read `e2e/phase2-1.spec.ts` and compare its actions with the report’s statements.
- **根本原因:** Acceptance points were inferred from partial paths instead of mapped to explicit assertions.
- **影響:** Passing results hide keyboard, focus, lock, tutorial-target, and footstep failures.
- **優先度:** P0
- **修正方法:** Add a keyboard-only suite and one complete unseeded new-game path; name assertions by requirement.
- **テスト方法:** Run the new suite independently and with all existing scenarios.
- **完了条件:** Every Phase 2.2 control and progression condition has a direct assertion.

## Differences from the Phase 2.1 report

- “Event-driven tutorial: Pass” was only partially true: events exist, but they carry no target identity.
- “Result/animation ordering: Pass” omitted that movement unlocks while the animation is still playing and action sounds occur earlier.
- “Easy mode: Pass” overstated the connection: several settings are unused and dialogue is unchanged.
- “File audio: Pass” overstated the shipped experience: the footstep file is never requested during movement.
- “Save migration: Pass” did not cover resource IDs changing with visual node names.
- “Required screenshots: Pass” established layout only; they could not validate keyboard, focus, audio, or action locks.
- “Collection: Pass” omitted Japanese-derived IDs and category-prefix first-discovery errors.

## Implementation order

The fixes will now proceed in the requested order:

1. activity input, focus, and player action lock;
2. target-dependent tutorial and child HUD;
3. audio timing and stable resource world definitions;
4. unused-code removal, responsibility extraction, and canonical documentation;
5. three small progression loops for lumen, collection milestones, island rank, and Nolla friendship;
6. stronger production-GLB acceptance validation and camera/occlusion presentation.

The character production gate is **failed/open** at audit time. No new procedural character will be generated.
