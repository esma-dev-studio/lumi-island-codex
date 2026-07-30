# Lumi Island Phase 2.1 completion report

Date: 2026-07-30

## Outcome

Phase 2.1 turns the existing vertical slice into a testable child-facing game loop. The tutorial now observes play, resource depletion is shared by the scene and save data, four activities have distinct interactions, discoveries feed a real collection screen, easy mode changes the visible experience, and licensed file-based sounds replace oscillator prototypes.

Two gates remain open:

1. The current procedural player GLB is still a temporary development asset and does not meet the authored-character acceptance gate.
2. `LumiIslandApp.tsx` and `LumiScenes.ts` remain large integration facades. New Phase 2.1 logic is isolated in small modules, but decomposing the legacy orchestration safely is future work.

## Gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| Event-driven tutorial | Pass | Seven typed steps consume movement, hint, gather, inventory, craft, place, and talk events |
| Resource world/save connection | Pass | Shared availability, depletion, recovery, visual state, save and reload behavior |
| Distinct activities | Pass | Three-hit wood rhythm, crack-choice stone, discovery forage, multi-phase fishing |
| Result/animation ordering | Pass | Scene owns pending activity settlement before reward commit |
| Easy mode | Pass | Larger controls, simplified copy, reduced shortcuts and more forgiving timing |
| Collection | Pass | 13 entries, four categories, silhouettes, hints, counts and completion percentages |
| File audio | Pass | 12 cached CC0 OGG files with effects volume and mute |
| Save migration | Pass | Version 1 and 2 saves migrate to version 3 without discarding progress |
| Automated browser coverage | Pass | 22 acceptance points across five Playwright scenarios |
| Required screenshots | Pass | 18 of 18 generated and visually reviewed |
| Production build | Pass | `vinext build` |
| Authored high-quality GLB | **Incomplete** | Current Mira: 7,763 triangles, 0 texture bytes, no UV set, single-joint full weights |
| Legacy facade split | **Partial** | New systems are extracted; the two main integration files remain over 1,000 lines |

## Automated verification

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm test` | 4 files, 43 tests passed |
| `npm run test:e2e` | 5 scenarios passed; 22 acceptance points covered |
| `npm run build` | Pass |
| `git diff --check` | Pass; line-ending notices only |

The browser suite also records page exceptions and console errors in every scenario. The final run completed with no captured errors.

## Browser acceptance coverage

1. Title screen renders.
2. A new story starts.
3. Walking advances the tutorial from a real movement event.
4. The next tutorial prompt reacts to the nearby gather target.
5. Opening the menu pauses the in-game clock.
6. Easy mode changes the game-screen state.
7. Easy mode removes keyboard shorthand from the main tool bar.
8. Manual save reports success and survives reload.
9. A nearby tree opens the wood-specific activity.
10. Wood requires three hits.
11. Completing wood gathering removes the immediate interaction.
12. The same tree is saved as depleted with a future recovery time.
13. Reload restores that tree as unavailable.
14. Stone uses crack selection and no timing track.
15. Foraging uses a discovery result.
16. A foraged discovery auto-registers.
17. The collection shows names and completion percentage.
18. Fishing begins with fish-shadow selection.
19. Fishing presents a timed bite.
20. Fishing requires reel inputs and reaches a catch.
21. The caught fish auto-registers in the collection.
22. Five character inspection views render without captured browser errors.

## Screenshot set

The automated run generated:

- title, tutorial walk, tutorial gather;
- player front, side, back, joint bend, and night;
- wood before, wood game, wood after;
- rock, foraging, fishing bite, fishing catch;
- collection, normal mode, and easy mode.

All 18 images are under `screenshots/` and were reviewed together as contact sheets. The UI remains readable, modal hierarchy is clear, and no blocking overlap was observed at the test viewport.

## Character handoff

`docs/CHARACTER_PRODUCTION_BRIEF.md` defines the required art direction, GLB technical contract, clips, deformation checks, source deliverables, and acceptance criteria. The present model must not be described as a finished high-quality character until a Blender-authored replacement passes that contract.

## Asset and release notes

- The action sounds use the CC0 `100 CC0 SFX #2` pack and are documented in `docs/ATTRIBUTIONS.md`.
- `public/og.png` is a project-specific social sharing image generated for this release.
- Debug-only character inspection and resource-state hooks are excluded from production behavior.
- Obsolete duplicate oscillator audio and old activity overlay sources were removed; they remain recoverable from Git history.
