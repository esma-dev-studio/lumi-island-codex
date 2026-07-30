# Lumi Island

光る小さな島で、探索、採取、クラフト、家具配置、住民との会話を楽しむ、子ども向け3Dスローライフゲームです。現在は Phase 2.2 のブラウザ向け Vertical Slice です。

## 必要環境

- Node.js 22.13 以上
- WebGL 2対応のPCブラウザ（Chrome推奨）

## 起動

```bash
npm ci
npm run dev
```

表示されたローカルURLを開きます。本番相当の確認は `npm run build` の後に行います。

## 操作

- `WASD` / 矢印: 歩く
- `Shift`: 走る
- `E` / `Space`: 調べる、採取、会話
- ミニゲーム: 矢印で選択、`E` / `Space`で操作、`Enter`で決定、`Esc`で安全に中断
- `Tab` / `I`: バッグ
- `C`: つくる
- `Q`: おねがい
- `Esc`: メニュー
- 家具配置中の `R`: 90度回転
- 家具の並べ替え中の `X`: バッグへ戻す
- マウスドラッグ / ホイール: カメラ操作

タッチ端末では方向パッドと大きな操作ボタンを表示します。PCではキーボード案内を優先します。

## Phase 2.2で遊べること

1. 対象を示す7段階チュートリアル
2. 木・石・採集・釣りの異なるミニゲーム
3. 資源の枯渇、見た目の変化、時間経過による回復
4. 家具の工作、配置、並べ替え
5. 住民のおねがい、図鑑、ルーメン、3段階の島ランクと毎日の島しごと
6. 通常表示と、短い文・広い判定・光ガイド・一文会話を使う「やさしい表示」

進行はブラウザの `localStorage` へ自動保存されます。現在のセーブ形式は version 3 です。旧Resource IDと旧図鑑IDは読み込み時に固定英数字IDへ移行します。

## 検証

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
python scripts/validate_character_glbs.py --output artifacts/character-gate.json
```

キャラクター検査は現在の仮GLBに対して意図どおり非0終了し、`artifacts/character-gate.json`へ不足条件を出力します。本番GLBへ差し替えるまでは合格しません。

Phase 2.2実装時点の自動テストは Vitest 55件、Playwright 15件です。最終結果は `docs/PHASE2_2_REPORT.md` を参照してください。

## 主な構成

- `src/scenes/IslandScene.ts`: 島シーン
- `src/world/EnvironmentBuilder.ts`, `ResourceBuilder.ts`, `OcclusionController.ts`: 環境生成と視界制御
- `src/scenes/ShowcaseScene.ts`: 3Dキャラクター検査シーン
- `src/world/`, `src/resources/`: 衝突、固定Resource定義、資源状態
- `src/player/`: 入力と行動状態
- `src/activities/`: ミニゲーム入力、結果確定
- `src/ui/`: HUD、パネル、会話、タイトル
- `src/audio/`: CC0 OGGを再生するWeb Audio実装
- `src/collection/`: 固定IDの図鑑データとオリジナルSVGサムネイル

## Source of Truth

- [権利・出典](./docs/ATTRIBUTIONS.md)
- [現在の制約](./docs/CURRENT_LIMITATIONS.md)
- [Phase 2.2監査](./docs/PHASE2_2_AUDIT.md)
- [Phase 2.2最終報告](./docs/PHASE2_2_REPORT.md)
- [本番キャラクター受入条件](./docs/CHARACTER_ASSET_REQUIREMENTS.md)

## 権利と注意

世界観、名称、UI、コード、キャラクターコンセプト、SVG図鑑絵は本プロジェクト用のオリジナルです。効果音にはCC0素材を使用しています。現在のGLBはアニメーション統合を検証するためのプロジェクト生成仮素材であり、本番品質アセットとは扱いません。詳細は `docs/ATTRIBUTIONS.md` に集約しています。