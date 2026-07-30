# Lumi Island Phase2 ベースライン

確認日: 2026-07-30

## 実行環境

| 項目 | 現在値 |
| --- | --- |
| Node.js | 24.12.0 |
| npm | 11.6.2 |
| Babylon.js | 9.18.1 |
| Babylon.js Loaders | 9.18.1 |
| React / React DOM | 19.2.6 |
| TypeScript | 5.9.3 |
| vinext | 0.0.50 |

## 自動検証

| 項目 | 結果 |
| --- | --- |
| 型チェック | 成功 |
| ESLint | 成功 |
| Vitest | 2ファイル・19件成功 |
| 本番ビルド | 成功 |
| ビルド警告 | Babylon.jsを含む500KB超チャンク |

Windowsの制限環境内ではVitestとViteの子プロセス生成が`EPERM`になったため、同じコマンドを許可済み環境で再実行し、テストとビルド自体が成功することを確認した。

## ブラウザ確認

- タイトル、新規開始、Character Showcase、チュートリアル、通常ゲーム、工作、バッグ、家具配置、ポーズ、手動セーブ、タイトルへ戻る、続きからを確認。
- 通常ゲームとCharacter Showcaseは60 FPS。
- メニュー表示中は08:06のまま2.2秒停止し、Phase1のポーズ修正が維持されている。
- 家具配置のゴースト、可否表示、回転ボタンを確認。
- 保存後、08:12から再開できた。
- consoleのerror / warnは0件。
- ブラウザ操作層が連続キー押下を保持できないため、変更前の移動、採取、釣り、NPC会話はコードと既存ロジックテストまでの確認になった。Phase2では画面上操作も追加し、最終E2Eで実操作できる状態にする。

## キャラクター

- `src/characters/CharacterFactory.ts`は450行で、`IcoSphere`、`Cylinder`、`Torus`等を組み合わせて4人を生成している。
- 本番ゲームとShowcaseの両方が同じ基本Geometryキャラクターを使用している。
- 骨格、スキニング、GLB、AnimationGroup、クロスフェード、表情制御はない。
- `setAnimation`が各部品の回転をフレームごとに直接書き換える。
- 4人とも人型の同系統シルエットで、動物型NPCは存在しない。
- GLB読み込み失敗時の本番向けエラー状態はない。
- Showcaseの「材質 7」「造形 18K以下」は実測値ではなく固定文字列。
- Showcaseは正面、側面、背面、斜め45度、夕方、blink、身長比較を個別確認できない。
- 夜のShowcaseは画面全体のコントラストが低く、文字と操作が読みづらい。

## 採取と釣り

- 木、石、植物、貝、キノコ、草、魚はすべて`Interactable`として同じ配列へ登録される。
- 近づいてEまたはSpaceを押すと、対象を26秒非表示にし、即座にアイテムを1個増やす。
- 木と石も全体が消え、専用のタイミング判定やオブジェクト変化はない。
- 植物と貝に初発見や時間帯変化はない。
- 釣り場はトーラス表示だけで、魚も通常資源と同じ即時採取処理になっている。
- フィードバックは共通の短い合成音、共通パーティクル、pickup動作だけ。

## ワールド・移動・ポーズ

- Phase1のカメラ基準移動、プレイヤー衝突、家具衝突は機能している。
- 家、木、岩、池の座標が描画側`LumiScenes.ts`と衝突側`CollisionWorld.ts`へ重複している。
- プレイヤーはNPCに衝突するが、NPC側は建物、池、家具、プレイヤー、他NPCを考慮せず直接移動する。
- ポーズ時はScene更新の先頭でreturnするためNPCとScene内`elapsed`は停止する。
- React側のゲーム時刻も停止する。
- 再開時の大きな時刻ジャンプは確認されなかった。

## リソース管理

- 採取パーティクルのたびに新しいMaterialを生成する。
- `CharacterFactory.ts`のMaterialキャッシュはScene IDをキーにするが、Scene破棄時にMapから削除しない。
- burst用Observerは終了時に解除するが、Scene破棄時に残存burstをまとめて整理する専用管理はない。
- GLB、Texture、AnimationGroupの共有・解放基盤は未実装。

## セーブ

- 現在の形式はVersion 1。
- プレイヤー位置、所持品、ルーメン、日付と時刻、依頼、家具、島レベル、採取・工作数を保存する。
- Version 1以外や破損値は安全な初期値へ戻す。
- やさしい表示、チュートリアル進行、初発見、釣った魚は未保存。

## UI・小学2年生向けUX

- `app/globals.css`には`0.52rem`、`0.55rem`、`0.58rem`、`0.62rem`等の主要文字が多数ある。
- 通常HUDに依頼、初心者ガイド、3つのツール、時刻、ルーメン、FPSが常時表示される。
- FPSは通常プレイでも常時表示される。
- チュートリアルは3項目を文章で同時に説明し、操作を一つずつ体験させない。
- 「やさしい表示」はない。
- 会話は一画面に2段落あり、次へ進む構造や読み上げ用データ構造はない。

## テスト

- Phase1の移動、衝突、配置、ポーズ、依頼進行を含む19件。
- キャラクター設定、GLB失敗、アニメーションマッピング、採取判定、釣り、初発見、セーブ移行、NPC衝突のテストはない。
- Playwrightの自動E2Eファイルはない。

## 既存スクリーンショット

- `screenshots/after-title.png`
- `screenshots/after-tutorial.png`
- `screenshots/after-character-day.png`
- `screenshots/after-character-night.png`
- `screenshots/after-island-day.png`
- `screenshots/after-island-night.png`
- `screenshots/after-placement-valid.png`
- `screenshots/after-placement-invalid.png`
- `screenshots/after-pause.png`

## 3Dアセット制作環境

- ImageGen: 利用可能。
- Blender CLI / Blender Python: 未導入。
- Babylon.js GLB loader: 導入済み。
- Python 3.12、NumPy、Pillow: 利用可能。
- trimesh、pygltflib等の3D生成ライブラリ: 未導入。
- 既存ファイルはキャラクターコンセプトPNGだけで、GLBはない。

Phase2ではImageGenでオリジナルのターンアラウンドを作成し、専用のパラメトリックメッシュ、骨格、スキニング、アニメーションを生成するプロジェクト内スクリプトからGLBを書き出す。Blender未導入を理由に基本Geometryへ戻さない。
