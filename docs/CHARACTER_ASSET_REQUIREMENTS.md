# Character asset requirements

Production characters are reviewed GLB 2.0 files loaded through `CharacterAssetLoader`. Basic Babylon geometry is permitted only for colliders and debug fallback visuals. A missing or rejected model must never be described as production.

## Automated acceptance gate

Run:

```bash
python scripts/validate_character_glbs.py --output artifacts/character-gate-90-plus.json
```

Every production model must pass:

- valid GLB 2.0 and Khronos glTF Validator error count 0;
- UV0 on every rendered primitive and at least one image texture;
- skin with Root, Hips, Head, left/right upper arms, and left/right upper legs;
- at least 9 authored animation clips;
- normalized VEC4 weights and meaningful multi-joint weighting;
- 80 KB–5 MB, 2k–60k triangles, 1–8 materials;
- manifest `assetStatus: production-reviewed` and `visualReview: passed`.

Rigid accessories such as a staff or dagger may be attached without skin weights and are recorded as warnings. Models use Y-up coordinates, a shared forward direction, and a foot-centered origin.

## Mandatory visual review

Automated validation is necessary but not sufficient. Inspect front, side, back, play camera, day/night lighting, movement, interaction, dialogue, ground contact, occlusion, and silhouette distinction before setting `visualReview: passed`.

## Current status

Mira/Ranger、Nolla/Monk、Kai/Rogue、Sera/Cleric from the Quaternius RPG Character Pack are CC0 and `production-reviewed`. All four pass the current technical gate with Khronos error 0. Runtime browser evidence reports `data-player-avatar=production-glb`.

Strict creative limitation: the source pack does not contain facial morphs or dedicated clips for every game verb. Fish, Mine, Craft, Talk, and Celebrate still require bespoke authored animation or an approved retargeted set before the project can claim the full animation rubric.
