# Lumi Island Phase2 実装計画

作成日: 2026-07-30

## 目標

Phase1の移動、衝突、家具配置、ポーズ、採取、工作、会話、依頼、セーブ、昼夜変化を維持しながら、キャラクター品質、採取と釣りの遊び、小学2年生向けUX、今後の拡張性を改善する。Vertical Sliceとして75点以上に相当する体験を目指す。

## 実装順序

### 1. キャラクター品質ゲート

#### 現状と原因

- 基本Geometryの部品キャラクターで、骨格、GLB、クロスフェードがない。
- Scene、見た目、アニメーションが`CharacterFactory.ts`へ集中している。
- Showcaseの性能値は固定で、品質判断に使えない。

#### 修正対象

- `scripts/generate_character_glbs.py`
- `src/characters/CharacterConfig.ts`
- `src/characters/CharacterAssetLoader.ts`
- `src/characters/CharacterView.ts`
- `src/characters/CharacterAnimationController.ts`
- `src/characters/CharacterController.ts`
- `src/ui/CharacterShowcase.tsx`
- Showcase Scene

#### 実装方法

- ImageGenのオリジナルターンアラウンドを造形基準にする。
- Miraと木工が得意なヤギのノラを最初の品質ゲートとする。
- 基本プリミティブをBabylon.js上で組み合わせず、カスタム輪郭を持つ専用メッシュを生成してGLB化する。
- 骨格、スキニング、9アニメーションをGLBに含める。
- 残るカイとセラも動物型の専用GLBへ置換し、本番画面から基本Geometryキャラクターをなくす。
- モデルパス、縮尺、補正、アニメーション名、ColliderをConfigへ置く。
- GLB読み込みはAssetContainerを共有し、インスタンスごとに複製する。
- 読み込み失敗時は本番で基本図形を出さず、安全なエラー表示を返す。
- アニメーション状態はクロスフェードし、blinkを独立制御する。
- Showcaseに視点、昼・夕・夜、比較、実測FPS・三角形・メッシュ・マテリアル・テクスチャ容量を追加する。

#### テストと完了条件

- Configとアニメーション名マッピングをユニットテスト。
- GLB失敗時に基本図形へ戻らないことをテスト。
- Miraとノラを正面、45度、側面、背面、昼、夜、主要アニメーションで目視確認。
- 足元、シルエット、服の厚み、昼夜コントラスト、60 FPS付近を確認。

#### リスク

- Blenderなしのため、自動ウェイトや高度な表情リグは使えない。専用生成スクリプトを再現可能な正式パイプラインとして残す。
- GLB容量増加により初回表示が遅くなる可能性がある。モデル共有、少数Material、テクスチャなしの頂点カラー中心で抑える。

### 2. 採取・釣りのゲーム化

#### 現状と原因

- 全対象が同じE一回処理で、木と石も消える。
- 釣り専用状態がない。

#### 修正対象

- `src/gathering/GatheringSystem.ts`
- `src/gathering/TimingGatheringGame.ts`
- `src/gathering/ForagingSystem.ts`
- `src/fishing/FishingSystem.ts`
- `src/fishing/FishingMiniGame.ts`
- `src/fishing/FishData.ts`
- `src/ui/minigames/*`
- `src/audio/AudioManifest.ts`

#### 実装方法

- 木は広い判定の往復ゲージ。通常1個、良い成功2個、失敗でも1個。
- 石は少し速いゲージと低確率の追加素材判定。
- 木と石は残し、短い揺れ、色変化、パーティクル、専用音を返す。
- 植物と貝は近接発見、揺れ、光、初発見表示にする。
- 釣りは待機、食いつき、入力、成功・再挑戦の短い状態機械にする。
- 各遊びを10〜20秒以内にし、失敗による全損を作らない。

#### テストと完了条件

- 木・石の境界、やさしい表示の判定幅、釣りの食いつき・成功・失敗、初発見をユニットテスト。
- ブラウザで木、石、植物または貝、釣り待機、成功、再挑戦を操作。
- 木と石の本体が消えないことを確認。

#### リスク

- 3D SceneとReact UIの二重状態がずれる可能性がある。ミニゲーム状態は純粋なControllerで管理し、Sceneは対象IDだけ渡す。

### 3. 小学2年生向けUX

#### 現状と原因

- 9〜14px相当の文字と常時HUDが多い。
- チュートリアルが文章を一度に見せる。

#### 修正対象

- `src/ui/accessibility/EasyMode.ts`
- `src/ui/tutorial/TutorialFlow.ts`
- `src/ui/LumiIslandApp.tsx`
- `app/globals.css`
- セーブVersion 2

#### 実装方法

- 通常本文16px、補足14px、ボタン16px、目的18px以上へ変更。
- 設定に「やさしい表示」を追加し、ひらがな、短文、大きい操作、広い判定を適用。
- 通常HUDを「今やること」「近くの操作」「バッグ・メニュー」中心へ整理し、FPSは設定内だけにする。
- 矢印キーを先に案内し、画面上方向ボタンも用意する。
- チュートリアルを一操作ずつ進め、いつでも再表示できるようにする。
- 会話を短いページへ分け、次へ・おわるを明確にする。

#### テストと完了条件

- やさしい表示の判定幅と文言をテスト。
- 1280×720で見切れ、重なり、小さすぎる文字がない。
- ブラウザ操作だけで移動、採取、バッグ、工作、配置、会話へ進める。

#### リスク

- すべての文字を一律拡大すると720px高で重なる。主要UIを整理し、パネルはスクロール可能にする。

### 4. Phase1関連コード修正

#### 現状と原因

- ワールド座標の重複、NPC衝突不足、Materialキャッシュ残存がある。

#### 修正対象

- `src/world/IslandLayout.ts`
- `src/world/CollisionWorld.ts`
- NPC移動Controller
- SceneのMaterial / Observer管理

#### 実装方法

- IslandLayoutの同じ定義から表示、Collider、配置禁止領域を作る。
- NPCはウェイポイントへ移動する前に、静的物、家具、他NPC、プレイヤーとの衝突を解決する。
- `realElapsedTime`と`gameElapsedTime`を分け、ポーズ中はゲーム時間を進めない。
- burst Materialを共有し、Scene破棄時にキャッシュとObserverを整理する。

#### テストと完了条件

- LayoutからCollider生成、NPC衝突、ポーズ時間、Scene再生成時の資源数をテスト。
- Phase1の全テストと家具保存復元を維持する。

## セーブ移行

- Version 1からVersion 2へ安全に移行する。
- 追加保存: やさしい表示、チュートリアル段階、初発見、釣った魚。
- 既存の位置、所持品、依頼、家具、時間は保持する。
- 破損した追加フィールドは個別に初期値へ補正する。

## 最終検証

- 型チェック、Lint、全ユニットテスト、本番ビルド。
- タイトルから保存再開までのブラウザE2E。
- 指定16枚のスクリーンショットを保存し、すべて目視確認。
- 通常ゲームとShowcaseでFPS、最低FPS、三角形、メッシュ、Material、ドローコール、テクスチャ容量、初回読み込み時間を記録。
- Scene再生成前後でリソースが増え続けないことを確認。

## Phase1への影響

- 移動入力とプレイヤー衝突の契約は維持する。
- 家具のデータ構造、配置判定、回転、移動、撤去を維持する。
- 既存依頼イベントの`gather`、`craft`、`place`契約を維持する。
- 既存セーブVersion 1はVersion 2へ移行し、捨てない。
- Phase1の19テストを全件回帰させる。
