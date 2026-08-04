# Lumi Island Zone Texture Atlas

Tool: OpenAI built-in ImageGen
Date: 2026-08-03
Use: production ground textures for the four explorable 3D zones

## Final prompt

Use case: stylized-concept
Asset type: production texture atlas for a cozy low-poly 3D children's island game
Primary request: create one square 2x2 atlas containing four clearly separated, tileable-looking ground surface swatches for four island zones
Scene/backdrop: orthographic flat material swatches only, no perspective scene
Subject: top-left warm central meadow with tiny cream clover speckles; top-right cool deep emerald forest moss with subtle leaf litter; bottom-left pale coral-gold harbor sand with tiny shells and wave-smoothed pebbles; bottom-right indigo moon garden grass with restrained lavender star-like flower speckles
Style/medium: premium hand-painted low-poly game texture, soft gouache, calm cozy island mood without copying any franchise
Composition/framing: exact 2x2 equal quadrants, straight clean boundaries at 50% horizontal and vertical, each quadrant fully filled edge-to-edge
Lighting/mood: flat albedo texture, no directional light, no shadows
Color palette: sage, emerald, coral sand, moonlit indigo, warm cream accents
Constraints: no text, no characters, no buildings, no water, no UI, no logos, no watermark, no strong gradient, no perspective, consistent texel density, low visual noise, suitable for repeating ground material on mobile WebGL
Avoid: photorealism, busy objects, obvious seams, embossed height, metallic surfaces

## Delivery

- Source atlas: `artifacts/art/zone-texture-atlas.png`
- Runtime: `public/assets/generated/zone-meadow.webp`
- Runtime: `public/assets/generated/zone-forest.webp`
- Runtime: `public/assets/generated/zone-harbor.webp`
- Runtime: `public/assets/generated/zone-moon-garden.webp`
