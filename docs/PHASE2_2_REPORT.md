# Lumi Island Phase 2.2 最終報告

実施日: 2026-07-30

## 結論

Phase 2.2のP0・P1、最小継続進行、コード整理、テスト、スクリーンショット、公開前セキュリティ更新は実装・検証済みです。ただし、チェックイン済み4体のGLBは統合用仮素材のままで、本番キャラクター受入ゲートは **FAILED / OPEN** です。この1点があるため「Phase 2.2の全完了」とは扱いません。

## 1. 独立レビューで見つけた問題

`docs/PHASE2_2_AUDIT.md`へ15件を、事象・再現手順・根本原因・影響・優先度・修正方法・テスト方法・完了条件の形式で記録しました。主な問題は、画面表示と実キーの不一致、行動アニメーション中の移動、対象を識別しないチュートリアル、未接続のやさしい表示と足音、表示ノード名に依存したResourceState、図鑑IDの日本語依存、終了する進行、偽陽性のGLB validator、巨大統合ファイル、出典資料の矛盾、E2Eの過大評価です。

## 2. Phase 2.1報告と異なっていた点

- 「イベント駆動チュートリアル」は対象IDを持たず、別の木・家具・住民でも進行し得ました。
- 「結果→アニメーション順」は、演出中に移動が解除される経路を見落としていました。
- 「やさしい表示」は設定値の一部が画面とロジックへ未接続でした。
- 「ファイル音源」は足音ファイルが存在するだけで、移動から再生されていませんでした。
- 「セーブ移行」は見た目のノード名変更と図鑑の日本語IDを覆っていませんでした。
- 5本のE2Eはマウス操作とseedが中心で、キーボード、フォーカス、音、行動ロックを直接保証していませんでした。

## 3. 修正したP0・P1

### P0

- E / Space / Enter / Escape / Tab / 矢印をミニゲーム共通入力へ統一。
- モーダル初期フォーカス、Tab循環、終了後canvas復帰、押しっぱなし二重入力防止。
- `free → prepare → animate → reward → free` のPlayerActionStateと移動ロック。
- 木・石・釣りをキーボードだけで完了可能に変更。
- チュートリアルイベントへ固定Resource ID、家具ID、住民IDを追加。
- 指定した木、最初の家具、ノラだけで該当ステップが進行。
- 「いったん隠す」をセッション限定にし、終了確認とメニューからの再開・最初からを分離。
- チュートリアル中は1目的だけを表示し、通常依頼カードを非表示。

### P1

- 歩行・走行速度に同期する足音、停止・行動ロック中の停止、活動別の確定音。
- ResourceDefinitionを描画、Interactable、ResourceState、Collider、場所ヒント、デバッグ表示の一元ソースに変更。
- 旧木・岩IDと旧日本語図鑑IDのセーブ移行。
- 図鑑を固定英数字ID、個別初発見、オリジナルSVGサムネイル、未発見シルエットへ変更。
- 初発見から図鑑へ直接移動し、25 / 50 / 75%で内容が解放。
- PCで方向パッドを隠し、coarse pointer / touch環境だけに表示。

## 4. キーボード操作の検証

Playwrightで以下を直接操作しました。

- 木: Eで開始、E / Spaceで3回、Enterで確定。フォーカス循環、二重入力防止、演出中移動ロック、canvas復帰を確認。
- 石: 左右で選択、Enterで確定。
- 釣り: 左右で魚影選択、Eで投げ、Spaceで引き、Enterで確定、Escapeで中断。
- Escape: ミニゲームを閉じてもメニューを誤って開かない。
- 足音: 移動中に再生要求数が増え、停止後は増えない。

## 5. チュートリアルのイベント条件

1. 移動距離が閾値を超える。
2. `wood-cedar-09`のヒントを受ける。
3. 同じ`wood-cedar-09`から木を採取する（最初は木3個を保証）。
4. バッグを開く。
5. `twig-stool`を工作する。
6. 実際に`twig-stool`を配置する。
7. `ノラ`と話す。

別Resource、別家具、カイとの会話では該当ステップは進みません。

## 6. 行動ロックの状態遷移

対象選択後に`prepare`、ミニゲーム確定後に`animate`、採取物反映時に`reward`、完了後に`free`へ戻ります。`animate`と`reward`ではプレイヤー移動と足音を止めます。カメラ操作とEscapeによる安全な中断は維持しています。

## 7. やさしい表示の実差分

- 短いひらがな中心の説明。
- キーボード文字を隠したバッグ・工作ボタン。
- 大きい操作UIと強いフォーカス表示。
- 次の対象を示す金色ガイド。
- 木・釣りの判定時間を拡大。
- 会話を一文ずつ表示。
- 同時表示する目的を1つに限定。

## 8. 音源と再生順

使用音源は `100 CC0 SFX #2`（rubberduck、CC0 1.0）です。詳細は `docs/ATTRIBUTIONS.md` に一元化しました。

- 歩行 / 走行: `footstep-grass.ogg`。走行は短い間隔、停止と行動ロックでは再生なし。
- 木 / 石 / 採集: 入力成功時にhit / rustle、確定時にpickup。
- 釣り: 投げる時にwater、食いつき時にfish-bite、確定時にpickup。
- Escape: ui-cancel。
- 工作 / 配置 / 依頼: craft / place / quest。

## 9. Resource IDとセーブ移行

`src/resources/ResourceDefinitions.ts`が固定英数字ID、位置、回転、見た目種別、Collider、操作半径、回復時間、場所ヒント、旧IDを保持します。`stableResourceId`と`sanitizeResourceStates`が旧`cedar-tree-*`、`tree-*`、`rock-cluster-*`、`rock-*`を新IDへ移行します。図鑑も`stableCollectionId`で旧日本語IDを移行します。表示ノード名はセーブキーに使いません。

## 10. 図鑑・ルーメン・島ランク・親密度

- 図鑑25%: 港のしるべレシピと25ルーメン。
- 図鑑50%: 月の池の釣りデッキと50ルーメン。
- 図鑑75%: 夜に光る花の庭と75ルーメン。
- ルーメン: 20で杉のベンチレシピ、15で森を3段階修復、10で未発見ヒント。
- 島ランク: 依頼、図鑑、家具配置、住民交流を評価する3段階。ランク2で海辺の橋、ランク3で島の門を表示。
- 親密度: ノラ・カイ・セラ各3段階。同じ住民との連続会話では1日1回だけ上昇。依頼達成でも該当住民との関係が進む。
- 依頼5件後: 日ごとに「採取5個 / 工作1個 / 配置1個」が循環する島しごとを表示し、達成時だけルーメンを1回付与。

## 11. 削除した旧コード

- `src/accessibility/EasyText.ts`
- `src/characters/CharacterFactory.ts`
- `src/fishing/FishingMiniGame.ts`
- `src/gathering/GatheringSystem.ts`
- `src/ui/CharacterShowcase.tsx`
- 未使用のD1 / Drizzleテンプレート (`db/`, `examples/d1/`, `drizzle.config.ts`)

Git履歴から復元可能です。

## 12. 分割した主要ファイル

- `src/scenes/IslandScene.ts` / `ShowcaseScene.ts`
- `src/world/EnvironmentBuilder.ts` / `ResourceBuilder.ts` / `OcclusionController.ts`
- `src/player/PlayerInputController.ts` / `PlayerActionController.ts`
- `src/activities/ActivityInputController.ts` / `ActivitySettlement.ts`
- `src/ui/GameHud.tsx` / `GamePanels.tsx` / `ResidentDialog.tsx`
- `src/progression/ProgressionSystem.ts`

`LumiIslandApp.tsx`は約1,153行から728行、島シーンは約1,744行から1,338行へ縮小しました。行数だけを目的にせず、状態所有と責務の境界で分けています。

## 13. ドキュメント修正

Source of Truthを以下へ統一しました。

- `README.md`
- `docs/ATTRIBUTIONS.md`
- `docs/CURRENT_LIMITATIONS.md`
- `docs/PHASE2_2_AUDIT.md`
- `docs/PHASE2_2_REPORT.md`
- `docs/CHARACTER_ASSET_REQUIREMENTS.md`

ルート`ATTRIBUTIONS.md`は正本への案内だけです。GLBを本番資産とする誤記、外部音源なしという誤記、操作・セーブ形式・テスト数の不一致を修正しました。

## 14. テスト件数と結果

- TypeScript: 成功。
- ESLint: 成功。
- Vitest: 5ファイル、55件成功。
- Playwright: 15シナリオすべて成功（分割実行で9件成功、検出した固定ID回帰を修正後1件成功、既存5件成功）。
- 依存更新後スモーク: チュートリアルとルーメン保存の2件成功。
- 本番ビルド: 成功（Vite 8.2.0 / vinext）。
- `npm audit --omit=dev`: 0件。最終`npm audit`: 0件。
- コンソール: 目視セッションはVite HMR debugとBabylon初期化logのみ。E2Eの監視でもpageerror / console errorなし。
- 旧セーブ: version 1 / 2 / 3、旧Resource ID、旧図鑑IDの移行テスト成功。

## 15. E2Eの完全導線

新規ゲームからの実導線で、移動、指定木への接近、木ミニゲーム3入力、演出中移動ロック、報酬、バッグ、工作、配置、ノラとの会話、チュートリアル完了、保存、再読込、状態復元を確認します。追加suiteでは木・石・釣りのキーボード完結、Escape、フォーカス、足音、やさしい表示、対象外Resource、ルーメン消費と保存も直接検証します。

## 16. 性能測定

- 1280×720の開発ブラウザ、通常島シーンでBabylon実測表示: 60 FPS。
- 本番ビルド時間: 約18秒（依存更新後の最終実行、各build工程の合計）。
- 最大クライアントチャンク: 約5.22 MiB（Babylon / CharacterView系、minified）。
- 結果: 実プレイは60 FPSですが、初回ロード用チャンクは500 kB警告を超えています。Babylon deep importと追加分割は次段階の性能課題です。

## 17. スクリーンショット

`/screenshots`で以下を目視比較しました。

- `phase2-2-title.png`
- `phase2-2-tutorial-normal.png`
- `phase2-2-tutorial-easy.png`
- `phase2-1-wood-game.png`
- `phase2-1-rock-game.png`
- `phase2-1-fishing-bite.png`
- `phase2-1-foraging.png`
- `phase2-1-collection.png`
- `phase2-2-rank-before.png`
- `phase2-2-lumen-exchange.png`
- `phase2-2-rank-after-world.png`
- `phase2-2-rank-after.png`
- `phase2-2-npc-dialogue.png`
- `phase2-2-island-day.png`
- `phase2-2-island-night.png`
- キャラクター前・横・後・関節曲げ・夜のPhase 2.1更新画像。

主要UIは16px以上、目的は1つ、コントラストと余白は良好です。進行前後、ルーメン消費、ランク3の門、会話時の両キャラクター、昼夜の可読性を確認しました。

## 18. キャラクター受入ゲート

ValidatorをUV0、画像テクスチャ、必須アニメーション、必須ボーン、正規化ウェイト、複数関節ウェイト、最大4ウェイト、Khronos glTF Validator、容量、三角形、マテリアル、manifest statusまで拡張しました。JSON証跡は`artifacts/character-gate.json`です。

現行4体は全て以下で失敗します。

- UV0: 0。
- images / textures: 0 / 0。
- 複数関節ウェイト頂点: 0。
- Khronos error: 各4。
- `assetStatus`: `integration-placeholder`。

12ジョイント、9アニメーション、約5k–7.8k三角形という統合条件はありますが、本番品質条件ではありません。新しいプロシージャルGLBを作って穴埋めせず、仮素材のまま明示しています。

## 19. 未解決事項

1. **本番キャラクターGLB（P0 / 外部制作依存）**: authored GLB、UV / texture、自然な複数関節ウェイト、Khronos error 0、全方向・全アニメーション目視レビューが必要です。
2. **初回ロード（P1）**: 最大5.22 MiBのBabylon系チャンクをdeep importと追加コード分割で縮小する必要があります。
3. **端末範囲（P2）**: PC ChromeとソフトウェアWebGLが中心で、実iPad / Androidの網羅的検証は未実施です。
4. **長期運営（P2）**: 今回は小さな継続ループまでで、クラウドセーブ、アカウント、長期イベントは対象外です。

以上により、ゲーム本体のPhase 2.2改善は公開可能な状態ですが、キャラクター品質だけは未完了と明記します。