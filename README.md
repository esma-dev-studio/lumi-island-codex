# Lumi Island

光る小さな島で、探索、採取、工作、家具配置、住民との交流、島づくりを楽しむ、子ども向け3Dスローライフゲームです。現在はPhase 2.3のブラウザ向けVertical Sliceです。

## 必要環境

- Node.js 22.13以上
- WebGL 2対応ブラウザ（PC Chromeを主に検証）

## 起動

```bash
npm ci
npm run dev
```

表示されたローカルURLを開きます。本番成果物は`npm run build`で作成します。

## 操作

- `WASD` / 矢印: 歩く
- `Shift`: 走る
- `E` / `Space`: 調べる、採取、会話
- ミニゲーム: 矢印で選択、`E` / `Space`で操作、`Enter`で決定、`Esc`で中断
- `Tab` / `I`: バッグ
- `C`: つくる
- `Esc`: メニュー
- 家具配置中の`R`: 90度回転
- 家具の並べ替え中の`X`: バッグへ戻す
- マウスドラッグ / ホイール: カメラ操作

タッチ端末では方向パッドと大きな操作ボタンを表示します。pointer終了・画面外移動・blur・ポーズで入力を解除し、指を離した後の追加入力を防ぎます。PCではキーボード案内を優先します。

## Phase 2.3で遊べること

1. 対象を示す7段階チュートリアル
2. 木・石・植物・釣りの異なるキーボード/タッチ対応ミニゲーム
3. 資源の見た目変化、時間経過による回復、図鑑への個別登録
4. 家具の工作、配置、並べ替え
5. 5件の初期依頼、初期依頼後の日替わり目標、3段階の島ランク
6. ルーメンを使った橋、森、家具レシピ、図鑑ヒントの選択
7. 解放後に実際の採取や魚が増える小島、港の釣り場、夜の庭、3段階の森
8. 会話・木材・家具で進むノラの親密度3段階と作業場イベント
9. 通常表示と、短い文・広い判定・光ガイド・一文会話を使う「やさしい表示」

ゲーム開始時は8ルーメンで、最初から全購入はできません。トップメニューは「バッグ」「島のずかん」「島づくり」「せってい」の4項目です。

進行はブラウザの`localStorage`へ自動保存されます。現在のセーブ形式はversion 4です。version 1〜3、旧Resource ID、旧図鑑IDは読み込み時に移行します。

## 検証

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run report:phase2.3
python scripts/validate_character_glbs.py --output artifacts/character-gate-phase2-3.json
```

Phase 2.3の自動テスト定義はVitest 67件、Playwright 16件です。`e2e/phase2-3-journey.spec.ts`はlocalStorageへ状態を直接投入せず、新規ゲームから採集、工作、配置、会話、森の修復、保存、再読込まで実操作します。

`npm run report:phase2.3`はテスト定義数、コード行数、クリーンビルドのJS容量、GLB/音声容量、Validator状態、スクリーンショットを`artifacts/phase2-3-metrics.json`へ出力します。

キャラクター検査は現在の仮GLBに対して意図どおり非0終了します。結果は`failed`であり、本番GLBへ差し替えるまでは合格しません。Validatorを実行できない場合は`unavailable`としてアセット不合格と区別します。

## 主な構成

- `src/scenes/`: 島・キャラクター確認シーン
- `src/world/`: 環境、資源、解放エリア、港、夜の庭
- `src/economy/`: 価格、報酬、購入処理
- `src/progression/`: 初期依頼、日替わり、島ランク、親密度、解放
- `src/input/`: タッチ移動入力
- `src/player/`: キーボード入力と行動状態
- `src/activities/`: ミニゲーム入力と結果確定
- `src/ui/`: HUD、4項目メニュー、島づくり、設定、会話
- `src/audio/`: CC0 OGGを再生するWeb Audio実装
- `src/collection/`: 固定IDの図鑑データとオリジナルSVGサムネイル

## Source of Truth

- [Phase 2.3独立監査](./docs/PHASE2_3_AUDIT.md)
- [経済バランス](./docs/ECONOMY_BALANCE.md)
- [Phase 2.3最終報告](./docs/PHASE2_3_REPORT.md)
- [権利・出典](./docs/ATTRIBUTIONS.md)
- [現在の制約](./docs/CURRENT_LIMITATIONS.md)
- [本番キャラクター受入条件](./docs/CHARACTER_ASSET_REQUIREMENTS.md)

## 権利と注意

世界観、名称、UI、コード、キャラクターコンセプト、SVG図鑑絵は本プロジェクト用のオリジナルです。効果音にはCC0素材を使用しています。現在の4体のGLBはアニメーション統合を確認するプロジェクト生成仮素材であり、本番品質アセットではありません。詳細は`docs/ATTRIBUTIONS.md`を正本とします。