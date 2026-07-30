# Lumi Island

光る小さな島で、探索、採取、クラフト、家具配置、住民のおねがいを楽しむオリジナル3Dスローライフゲームです。

## 起動

```bash
npm install
npm run dev
```

表示されたローカルURLをPCブラウザで開きます。

## 操作

- `WASD` / 矢印: 歩く
- `Shift`: 走る
- `E` / `Space`: 近くのものを調べる、採取、会話
- `Tab` / `I`: バッグ
- `C`: つくる
- `Q`: おねがい
- `Esc`: メニュー
- 家具配置中の `R`: 90度回転
- 家具の並べ替え中の `X`: バッグへ戻す
- マウスドラッグ / ホイール: 3Dカメラの向きと距離

## 遊び方

1. 島を歩き、木、石、実、ハーブ、貝などを見つける
2. 近くで `E` を押して採取する
3. `C` で作業台を開き、集めた材料から家具を作る
4. `I` でバッグを開き、最初にもらったいすや作った家具を、緑色になる場所へ置く
5. ノラ、カイ、セラと話し、5つのおねがいを進める
6. 夕方から光り始める島を、自分の家具で育てる

進行は端末内に自動保存されます。メニューから手動保存もできます。

## 構成

- `app/`: ページと全体スタイル
- `src/characters/`: キャラクター造形とアニメーション
- `src/scenes/`: Babylon.jsの島とShowcase
- `src/game/`: 純粋なゲームロジックと型
- `src/data/`: アイテム、レシピ、依頼、キャラクター設定
- `src/ui/`: タイトル、HUD、各メニュー
- `src/audio/`: Web Audio APIの短いフィードバック音
- `src/save/`: セーブ、復元、安全な初期化
- `tests/`: Vitestロジックテスト
- `.prompts/`: 再生成可能なキャラクタープロンプト

## 検証

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 仕様と方針

- [PLAN.md](./PLAN.md)
- [ART_DIRECTION.md](./ART_DIRECTION.md)
- [CHARACTER_SPEC.md](./CHARACTER_SPEC.md)
- [ASSET_PIPELINE.md](./ASSET_PIPELINE.md)
- [ATTRIBUTIONS.md](./ATTRIBUTIONS.md)

## 制約

現在はPCブラウザ向けVertical Sliceです。ログイン、課金、マルチプレイ、オンラインランキング、バックエンドは含みません。

## ライセンスとIP

世界観、名称、住民、ゲームルール、UI、3D造形、生成キャラクターコンセプトは本プロジェクトのオリジナルです。外部アセットは使用していません。
