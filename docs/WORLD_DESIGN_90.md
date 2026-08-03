# World Design 90

この文書は実装済みworldの説明ではなく、次phaseの受入設計である。Visual targetは artifacts/art/world-map-concept.png。

| zone | landmark | 固有景観3点以上 | 固有行動 | 固有報酬 |
|---|---|---|---|---|
| 中央集落 | 光の広場灯 | 非対称家、庭、小物、土道 | 会話、工作、配置 | 初期依頼と住民進行 |
| 森 | 倒木トンネル | 坂、岩壁、木漏れ日、密植 | 共同修復、新通路 | 新素材と工作 |
| 港・海岸 | 完成した桟橋 | 砂浜、岩礁、船具、波打ち際 | 2地点釣り、漂着物 | 港魚と海辺素材 |
| 橋先・夜の庭 | 月の泉 | 高低差、発光植生、石庭、水面分離 | 夜導線、特別採取 | 夜植物、ノラ作業場 |

## 規模

- 歩行可能面積: 現在の2.5〜3倍。
- 通常歩行端間: 35〜55秒、走行20〜35秒。
- zone間: 8〜20秒。
- 5秒以上の空移動を作らず、曲がり角ごとにlandmark、採取候補、音、光のいずれかを置く。
- procedural scatterはseed固定でscale/rotation/color/densityを変え、Thin InstanceまたはInstanceを優先。

## 段階導入

中央集落の既存座標とsave座標を変えず、外周接続口を追加する。旧saveのplayer positionは中央集落内に維持し、解放済みflagから各zone入口を復元する。terrain、collision、zone trigger、ambient、cameraを同一registryで定義し、見た目だけの解放を防ぐ。
