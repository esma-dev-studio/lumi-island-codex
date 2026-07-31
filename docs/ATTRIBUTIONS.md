# Lumi Island 権利・出典（Source of Truth）

Lumi Islandの世界観、名称、コード、キャラクターGLB仮素材、キャラクターコンセプト、図鑑SVGは本プロジェクト用です。効果音のみ、下記のCC0外部素材を収録しています。

## キャラクターコンセプト

- Assets: `public/assets/characters/lumi-island-character-concept.png`, `phase2-character-turnaround.png`
- Author: OpenAI ImageGen（本プロジェクト向けにディレクション・生成・選定）
- Source URL: なし
- Use: 3Dシルエット、色、服装、住民の特徴を検討する参照画像
- Production use: 参照画像のみ。3Dモデルのテクスチャには転用していません

## キャラクターGLB

- Assets: `mira.glb`, `nolla.glb`, `kai.glb`, `sera.glb`
- Author: 本リポジトリの `scripts/generate_character_glbs.py`
- Source URL: なし
- License: リポジトリと同じ条件のプロジェクト内生成物
- Contents: オリジナルのプロシージャルメッシュ、6マテリアル、12ジョイント、9アニメーション
- Asset status: `integration-placeholder`
- Production use: **不可**。UV0、画像テクスチャ、複数関節ウェイト、本番レビューが未達です
- Gate evidence: `artifacts/character-gate-phase2-3.json` (`failed`; `unavailable`とは区別)

## 効果音

- Pack: `100 CC0 SFX #2`
- Author: rubberduck
- Source: https://opengameart.org/content/100-cc0-sfx-2
- License: CC0 1.0
- Modifications: 必要な音を選び、用途名へ変更して `public/assets/audio/cc0-sfx-100-v2/` に配置。`src/audio/FileAudioManifest.ts` で再生ゲインを調整
- Production use: UI、キャンセル、採取、工作、配置、依頼、足音、木、石、水、釣り

## SNS共有画像

- Asset: `public/og.png`
- Author: OpenAI ImageGen（本プロジェクト向けに生成・選定）
- Source URL: なし
- Modifications: 1200×630へ中央トリミング・リサイズ
- Production use: SNSプレビューのみ

このファイルが権利・出典の唯一のSource of Truthです。ルートの `ATTRIBUTIONS.md` はこのファイルへの案内だけを保持します。