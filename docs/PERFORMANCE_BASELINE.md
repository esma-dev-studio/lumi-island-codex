# Performance Baseline

基準日: 2026-08-03（今回変更前の既存artifact）

| metric | measured |
|---|---:|
| manifest JS | 3,465,947 bytes |
| largest client chunk | 1,026,065 bytes |
| GameCanvas initial static | 1,868,205 bytes / 36 files |
| GameCanvas dynamic | 2,736,685 bytes / 130 files |
| GLB | 1,100,168 bytes / 4 files |
| audio | 123,718 bytes / 12 files |

既存quality profileはlow/standard/highでresolution、shadow、particle、glowを調整する。これは性能制御の実装証拠であり、FPS証拠ではない。

未測定: first paint、interactive time、average/min FPS、p95 frame、draw calls、mesh/material/texture数、15分memory delta、4x CPU、slow network、physical tablet。推測値は記入しない。
