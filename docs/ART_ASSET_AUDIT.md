# Art Asset Audit

## Character Gate

4体のGLB、合計1,100,168 bytesを再検証した。全体とも assetStatus は integration-placeholder。

| model | triangles | joints | animations | UV/image texture | multi-joint vertices | Khronos errors | gate |
|---|---:|---:|---:|---|---:|---:|---|
| mira.glb | 7,751 | 12 | 9 | なし | 0 | 4 | failed |
| nolla.glb | 7,767 | 12 | 9 | なし | 0 | 4 | failed |
| kai.glb | 6,691 | 12 | 9 | なし | 0 | 4 | failed |
| sera.glb | 5,031 | 12 | 9 | なし | 0 | 4 | failed |

GLBは読み込み統合を保つ仮素材であり、本番品質として数えない。専用Animation名があっても、UV、texture、自然なweight、validator error 0、本番visual reviewが未達。

## Environment

- 地形、家、木、岩、家具の多くはprimitiveベース。
- materialは共有されており、今回ownership bugを修正。
- zone別texture atlas、heightmap、terrain GLB、LODのproduction evidenceはない。
- 音声12ファイルはCC0、合計123,718 bytes。zone別ambient loopの完成証跡はない。

## ImageGen

Visual Master 4点は方向統一に有効。ゲーム内使用は最適化した island-map.webp 1点だけ。残り3点を実装済みartとして加点しない。
