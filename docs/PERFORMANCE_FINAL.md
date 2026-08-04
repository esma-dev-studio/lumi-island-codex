# Performance Final

測定日: 2026-08-03
証跡: `artifacts/performance-90-plus.json`

## Runtime

| condition | sample | avg FPS | min FPS | p95 frame | meshes / active | materials | textures | animation groups | console errors |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| desktop 1280×720, native GPU | 60 s | 59 | 53 | 17.86 ms | 501 / 106 | 88 | 20 | 37 | 0 |
| tablet equivalent 1024×640, touch/mobile, native GPU | 13 s | 54 | 10 | 20 ms | 501 / 90 | 88 | 20 | 37 | 0 |

両条件とも自動選択されたlow detail profile。平均FPS目標（PC 55、tablet相当30）を通過した。tablet最低10FPSは初期GLB・texture読込を含み、改善余地として残す。物理iPadの実測ではない。

## Build output

| metric | before clean | final | delta |
|---|---:|---:|---:|
| dist total | 65,727,879 bytes | 26,510,719 bytes | -59.67% |
| client total | stale hashes混在 | 17,488,992 bytes | clean build |
| client JavaScript | stale hashes混在 | 4,118,809 bytes | clean build |
| largest client chunk | 1,026,811 bytes observed before clean | 886,761 bytes | -13.64% |

`npm run build`の前に、プロジェクト名と直下`dist`を検証する `scripts/clean_dist.mjs` を実行する。過去hash成果物の公開混入を防ぐ。production buildは成功したが、500kB超chunk warningは継続。

## Lifecycle and quality controls

- 60秒rolling telemetryをcanvasへ公開し、FPS、p95、mesh、material、texture、animation groupを実測。
- ゾーン環境音はタブ非表示時にsuspendし、設定変更とdisposeに対応。
- 影と植生密度はdetail profileで段階調整。
- 4ゾーンtextureは512×512 WebP、配信合計132,780 bytes。

## 未測定

- 物理iPad/低性能PC。
- CPU 4倍スロットリング、低速回線、操作可能までの時刻。
- 15分反復後のmemory delta。
- 昼夜それぞれの長時間測定。

推測値では埋めず、最終採点から減点する。
