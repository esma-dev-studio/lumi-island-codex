# Character asset requirements

Production characters are GLB 2.0 files loaded through `CharacterAssetLoader`.
Basic Babylon geometry is permitted only for colliders and debug visuals; a
missing production model must produce an explicit safe error state.

Each model must use Y-up coordinates, face the shared forward direction, keep
the origin at the center of the feet, use a skeleton and skinned mesh, and
contain these animation groups:

`idle`, `walk`, `run`, `talk`, `pickup`, `interact`, `happy`, `surprised`,
`blink`.

Recommended budget per character is 15–30k triangles, 2–6 materials, one
texture atlas where textures are needed, and 1K textures by default (2K only
with a visible benefit). Lumi Island's current original, texture-free models
are intentionally below the triangle recommendation to protect low-end school
PC performance; quality is achieved through silhouette, face readability,
layered materials, animation, and lighting.

The mandatory visual gate is front, 45-degree, side, back, day, evening, and
night inspection in Character Showcase. Feet must stay grounded, silhouettes
must remain distinct, and faces and labels must stay readable at night.

