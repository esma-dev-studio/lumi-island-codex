# Art Asset Audit

更新日: 2026-08-03

## Character Gate

QuaterniusのCC0 RPG Character Packから4体を統合し、プロジェクト生成仮GLBを置換した。全モデルがUV、画像テクスチャ、32 joints、multi-joint weights、Khronos Validator error 0、目視レビューを通過。

| model/source | bytes | triangles | materials/images | joints | animations | Khronos errors | gate |
|---|---:|---:|---:|---:|---:|---:|---|
| Mira / Ranger | 1,900,384 | 3,806 | 2 / 1 | 32 | 14 | 0 | passed |
| Nolla / Monk | 1,723,956 | 6,714 | 1 / 1 | 32 | 11 | 0 | passed |
| Kai / Rogue | 1,631,308 | 2,326 | 2 / 2 | 32 | 12 | 0 | passed |
| Sera / Cleric | 1,970,120 | 5,104 | 2 / 2 | 32 | 11 | 0 | passed |

Khronos warningは一部モデルの `NODE_SKINNED_MESH_NON_ROOT` 1件。errorは0。剣、杖等のrigid accessoryがskin weightを持たない点は意図された構造としてwarning記録。

制約: authored packに表情モーフはなく、Fish/Mine/Craft/Talk/Celebrate専用クリップもない。ゲーム側はPickUp、Punch、Spell等へ意味動作を対応付ける。このため厳格な「専用アニメーション」項目は未達。

## Environment

Kenney Nature Kit 2.1（CC0）から8 GLBを採用し、中央広場、森、港、橋先、月しずくの庭へ10配置した。樹木、倒木、石段、岩、カヌー、橋をprimitiveだけではないproduction meshへ置換・補強。

4ゾーンには別々の512×512 WebP地面テクスチャ、配色、ランドマーク、環境音がある。実ブラウザは `data-production-environment="10/10"`、console error 0。

残る基本図形は家や既存ランドマークの一部。世界全体を外部GLBへ置換したわけではないため、環境アートは満点ではない。

## ImageGen

実ゲーム使用は `island-map.webp` と4ゾーンテクスチャ。生成しただけのVisual Master 4点は制作基準資料であり、ゲーム内加点に含めない。4テクスチャは合計132,780 bytes、展開時VRAMは概算4 MiB。

## Audio

CC0効果音12ファイルに加え、Web Audioで4ゾーン固有の環境音を実装。ミュート、音量、フェード、タブ非表示停止、disposeに対応する。
