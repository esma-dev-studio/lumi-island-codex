# ImageGen Asset Report

生成日: 2026-08-03
生成元: OpenAI ImageGen
manifest: `public/assets/generated/asset-manifest.json`

## ゲーム内使用アセット

| file | purpose | source | delivery | bytes | estimated VRAM |
|---|---|---|---:|---:|---:|
| island-map.webp | title world art | 1536×1024 PNG | 1280×720 WebP | 168,146 | 約3.5 MiB |
| zone-meadow.webp | 広場の草花地面 | atlas 768×512 crop | 512×512 WebP | 38,750 | 1 MiB |
| zone-forest.webp | 森の葉と苔地面 | atlas 768×512 crop | 512×512 WebP | 37,986 | 1 MiB |
| zone-harbor.webp | 港の砂と貝地面 | atlas 768×512 crop | 512×512 WebP | 24,638 | 1 MiB |
| zone-moon-garden.webp | 月夜の庭地面 | atlas 768×512 crop | 512×512 WebP | 31,406 | 1 MiB |

4ゾーン配信テクスチャ合計は132,780 bytes。2の累乗512×512へ縮小し、WebP化した。ソースatlas 2,541,025 bytesは `public` 外へ保管し配信しない。

## Source masters

| file | purpose | size | bytes | used directly |
|---|---|---:|---:|---|
| style-board.png | character/island style | 1536×1024 | 2,960,842 | no |
| world-map-concept.png | four-zone map | 1536×1024 | 2,691,673 | no |
| color-script.png | day/sunset/night | 1823×863 | 2,416,543 | no |
| ui-direction.png | child UI direction | 1536×1024 | 2,705,531 | no |
| zone-texture-atlas.png | four-panel terrain source | 1536×1024 | 2,541,025 | no |

## Prompts

- Visual Master: `.prompts/lumi-island-visual-master.md`
- Zone atlas: `.prompts/lumi-island-zone-textures.md`
- Zone atlas direction: four-panel seamless stylized low-poly hand-painted terrain texture atlas; warm meadow, moss forest, shell sand harbor, moonlit blue garden; no text, logos, characters, UI, or recognizable IP.

## Integration

`WorldZones.ts`で4枚をBabylon.jsの地面マテリアルへ統合し、実ブラウザの4ゾーン画像で確認した。タイトル画像はCSS backgroundとして使用。未使用source masterを実装済み成果として数えない。
