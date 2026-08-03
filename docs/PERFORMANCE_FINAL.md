# Performance Final

測定日: 2026-08-03

| metric | final | delta/判定 |
|---|---:|---|
| manifest JS | 3,472,935 bytes | +6,988 bytes。title code/RC changesを含む |
| largest client chunk | 1,026,065 bytes | unchanged、500k warning継続 |
| GameCanvas initial static | 1,873,545 bytes / 36 files | +5,340 bytes |
| GameCanvas dynamic | 2,738,804 bytes / 130 files | +2,119 bytes |
| title generated WebP | 168,146 bytes | new |
| production build | passed | large chunk warningあり |
| fresh browser console | 0 error / 0 warning | 1024×768 current build |

Visual source PNGは public 配信対象に含めず、配信は168KB WebPのみ。共有Material dispose修正はruntime破損と不要な再生成riskを抑える。

FPS、p95、draw call、mesh/material/texture count、15分memory、CPU throttle、slow network、physical tabletは今回も未測定。この不足によりperformanceは満点にしない。
