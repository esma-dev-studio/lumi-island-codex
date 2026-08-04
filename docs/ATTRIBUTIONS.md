# Lumi Island 権利・出典（Source of Truth）

更新日: 2026-08-03

Lumi Islandの名称、世界観、コード、UI、図鑑SVG、ゲーム設計は本プロジェクト用です。外部アセットは下記の権利確認済み素材だけを使用しています。

## 3Dキャラクター

- Pack: RPG Character Pack
- Author: Quaternius
- Source: https://quaternius.com/packs/rpgcharacters.html
- License: CC0 1.0
- Runtime assets: `public/assets/characters/models/mira.glb`, `nolla.glb`, `kai.glb`, `sera.glb`
- Source mapping: Mira=Ranger、Nolla=Monk、Kai=Rogue、Sera=Cleric
- Modifications: 公式glTFから自己完結GLBへ変換し、ゲーム用の名前、縮尺、向き、アニメーション対応を設定
- Validation: Khronos Validator error 0、UV、画像テクスチャ、32 joints、multi-joint weights、11〜14 animation。`artifacts/character-gate-90-plus.json`
- Limitation: Pack固有の表情モーフおよびFish/Mine/Craft/Talk/Celebrate専用クリップはなく、ゲームの意味動作を既存クリップへ対応付けています

## 3D環境

- Pack: Nature Kit 2.1
- Author: Kenney
- Source: https://kenney.nl/assets/nature-kit
- License: CC0 1.0
- Runtime assets: `public/assets/environment/kenney-nature-kit/` のGLB 8点と `LICENSE.txt`
- Modifications: 公式GLBから橋、カヌー、石段、丸太、岩、樹木を選定し、4ゾーンへ10配置。位置、縮尺、回転、影設定をゲーム向けに調整
- Validation: 実ブラウザで10/10読込、console error 0。`artifacts/environment-asset-gate-90-plus.json`

## ImageGen生成アート

- Author/Generator: OpenAI ImageGen
- License/provenance: 第三者の配布画像を入力に含めない本プロジェクト向け生成物
- Visual Master: `artifacts/art/style-board.png`, `world-map-concept.png`, `color-script.png`, `ui-direction.png`
- Runtime title: `public/assets/generated/island-map.webp`
- Runtime zone textures: `zone-meadow.webp`, `zone-forest.webp`, `zone-harbor.webp`, `zone-moon-garden.webp`
- Source atlas: `artifacts/art/zone-texture-atlas.png`
- Prompt records: `.prompts/lumi-island-visual-master.md`, `.prompts/lumi-island-zone-textures.md`
- Report: `docs/IMAGEGEN_ASSET_REPORT.md`

## 効果音

- Pack: 100 CC0 SFX #2
- Author: rubberduck
- Source: https://opengameart.org/content/100-cc0-sfx-2
- License: CC0 1.0
- Modifications: 必要な音を用途名へ変更し、再生ゲインを調整
- Runtime use: UI、採取、工作、配置、依頼、足音、木、石、水、釣り

## ゾーン環境音

- Author: 本プロジェクト
- Source: `src/audio/ZoneAmbientAudioSystem.ts`
- Provenance: Web Audio oscillator、filter、deterministic noiseで実時間合成するオリジナル音響
- Runtime use: 広場、森、港、月しずくの庭の4プロファイル。音量設定、ミュート、タブ非表示停止に対応

## SNS共有画像

- Asset: `public/og.png`
- Author: OpenAI ImageGen
- Modifications: 1200×630へ中央トリミング・リサイズ
- Production use: SNSプレビューのみ

ライセンス不明アセットはありません。このファイルを権利情報の正本とします。
