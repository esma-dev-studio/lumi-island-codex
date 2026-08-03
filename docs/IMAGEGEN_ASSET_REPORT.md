# ImageGen Asset Report

生成日: 2026-08-03
生成元: OpenAI ImageGen
prompt source: .prompts/lumi-island-visual-master.md
machine manifest: public/assets/generated/asset-manifest.json

| file | purpose | source size | delivery | bytes | in game |
|---|---|---:|---:|---:|---|
| artifacts/art/style-board.png | character/island style | 1536×1024 PNG | source only | 2,960,842 | no |
| artifacts/art/world-map-concept.png | four-zone map | 1536×1024 PNG | source only | 2,691,673 | no |
| artifacts/art/color-script.png | day/sunset/night | 1823×863 PNG | source only | 2,416,543 | no |
| artifacts/art/ui-direction.png | child UI direction | 1536×1024 PNG | source only | 2,705,531 | no |
| public/assets/generated/island-map.webp | title world art | 1536×1024 source | 1280×720 WebP | 168,146 | yes |

## optimization

world-map sourceから16:9へcrop/resizeし、WebPへ圧縮した。元PNG 2,691,673 bytesから168,146 bytesへ93.8%削減。配信assetのみ public 以下へ置き、source masterと分離した。

## integration

TitleScreenのCSS backgroundとして使用。初回の next/image 統合はVinext dev runtimeでmodule export errorを起こしたため、browser QAで検出しCSS方式へ変更した。修正後fresh tabのconsole error/warningは0。未使用3点は将来の制作基準であり、現在のgame art改善点としては数えない。
