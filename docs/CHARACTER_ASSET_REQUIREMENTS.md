# Character asset requirements

Production characters are reviewed GLB 2.0 files loaded through `CharacterAssetLoader`. Basic Babylon geometry is permitted only for colliders and debug visuals. A missing or rejected model must keep a safe, clearly labelled integration fallback; the fallback must never be described as a production asset.

## Automated acceptance gate

Run:

```bash
python scripts/validate_character_glbs.py --output artifacts/character-gate.json
```

Every production model must pass all of these checks:

- valid GLB 2.0 and Khronos glTF Validator error count 0;
- UV0 (`TEXCOORD_0`) on every rendered primitive;
- at least one image texture and texture binding;
- a skin with the required named bones;
- `idle`, `walk`, `run`, `talk`, `pickup`, `interact`, `happy`, `surprised`, `blink`;
- normalized skin weights, no more than four weights per vertex, and meaningful multi-joint weighting;
- 80 KB–5 MB file size, 3k–60k triangles, and 1–8 materials;
- manifest `assetStatus: "production-reviewed"`.

Recommended delivery is 15–30k triangles, 2–6 materials, one atlas, and 1K textures by default (2K only with visible benefit). Models use Y-up coordinates, face the shared forward direction, and keep the origin at the center of the feet.

## Mandatory visual review

Automated validation is necessary but not sufficient. Before changing `assetStatus`, inspect front, 45-degree, side, back, day, evening, night, all required animations, close camera, NPC dialogue, fishing, and occlusion. Feet must stay grounded, silhouettes must remain distinct, textures must hold up at play distance, and faces must remain readable at night.

## Current status

The four checked-in procedural GLBs are `integration-placeholder`. They intentionally keep gameplay operational, but currently have no UV0 or textures, no multi-joint vertex weighting, and Khronos validation errors. The character gate therefore remains **failed/open**. See `docs/CURRENT_LIMITATIONS.md`, `docs/CHARACTER_PRODUCTION_BRIEF.md`, and `artifacts/character-gate.json`.