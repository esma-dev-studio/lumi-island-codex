---
name: lumi-island-review
description: Audit and improve Lumi Island release candidates across progression, child UX, 3D asset gates, performance, browser evidence, save compatibility, and honest scoring. Use for Lumi Island reviews, release preparation, regression checks, or score reassessment.
---

# Lumi Island Review

Use this workflow when reviewing or improving a Lumi Island release candidate. Treat reports as claims to verify, not as ground truth.

## Workflow

1. Read `AGENTS.md`, `README.md`, current release reports, save schema, package scripts, and `references/release-checklist.md`.
2. Capture a clean baseline with `git status`, tool versions, unit tests, typecheck, lint, build, character gate, and existing metrics.
3. Inspect code and real browser behavior independently. Check progression reachability, economy, controls, UI density, responsive layout, console output, and save migration.
4. Fix P0/P1 defects before cosmetic work. Preserve old saves and add a regression test for each progression or economy fix.
5. Use ImageGen only for original 2D art. Keep source art under `artifacts/art`, delivery assets under `public/assets/generated`, and prompts under `.prompts`.
6. Never classify generated 2D art or primitive GLBs as production character assets. Keep the Character Gate failed until UVs, textures, skinning, animations, rights, and Khronos validation all pass.
7. Re-run tests, typecheck, lint, build, and browser QA. Distinguish measured values from targets and unmeasured items.
8. Score using the requested rubric. Do not award 90+ if any mandatory 90-point gate is missing.

## Evidence rules

- State the exact command, date, result, and limits for every validation claim.
- Browser screenshots need a manifest with route, viewport, state, steps, and test support.
- Do not call debug teleport, accelerated time, or direct state injection a normal journey.
- Do not infer FPS, memory, draw calls, or device performance from bundle size.
- Record generated assets even when unused, but count only game-integrated assets as product improvement.
- Keep licenses and provenance in `ATTRIBUTIONS.md` and `docs/ASSET_CATALOG.md`.

## Priority order

1. Save corruption or progression lock.
2. Incorrect economy charge or unreachable content.
3. Child-blocking controls, unclear next action, or destructive action without confirmation.
4. Console/runtime errors and lifecycle leaks.
5. Normal journey coverage.
6. World, art, sound, and performance polish.

## Required handoff

Report these buckets separately: implemented and browser-verified; implemented but not device-verified; test-only; external-asset blocked; unimplemented; failed commands; remaining 90-point blockers. Include changed files, save migration notes, test results, evidence links, and a conservative score.
