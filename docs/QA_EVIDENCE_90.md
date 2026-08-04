# QA Evidence 90

検証日: 2026-08-03

## Final gates

| check | result | evidence / limitation |
|---|---|---|
| Vitest | passed | 8 files / 88 tests |
| TypeScript | passed | `tsc --noEmit` |
| ESLint | passed | 単独実行75.1秒 |
| production build | passed | clean `dist`; 500k chunk warningのみ |
| Character Gate | passed | 4/4、Khronos error 0、visual review passed |
| production environment | passed | Kenney CC0、runtime 10/10 |
| normal-speed first loop | passed | 6.6分、teleport/倍率/progress injectionなし |
| 4-zone visual E2E | passed | production player、4 texture、10 environment placements |
| iPad-equivalent touch E2E | passed | 1024×640、touch/mobile、平均54FPS |
| console errors | 0 | normal/visual E2Eとlive browser |
| save migration | passed | unit + E2E reload、version 5 |

## Playwright evidence

Playwrightは7 files / 22 tests。各テストには最終作業中の分割・対象実行で成功証跡がある。

- phase2-2 tutorial 4件、input/action 6件、visual 2件、release tablet 1件: full run内で13件success。
- phase2-3 journey、release 100%、release tablet/touch: targeted runで4件success（tablet 1件は重複）。
- normal-speed journey、phase2-1 title/save、wood: targeted runで3件success。
- Scene teardown修正後、phase2-1 rock/forage、fishing、character showcase: 3/3 success。

Unique coverageは22/22。全22件を2 workersで1コマンド実行した最終試行は、途中failure出力なしのまま外側30分制限に達したため、one-shot greenとは報告しない。分割実行の成功と一括timeoutを区別する。

## Regression found and fixed

1. easy modeを新規既定にした後、旧E2Eが標準文言と1段階会話を期待していた。やさしい文言、ON→OFF→ON、つぎ→またねへ更新。
2. normal journey中にNollaが移動し、過去座標へ到着するflaky case。最新NPC位置へ追従し、実際のclosest targetとdialogで判定。
3. touch専用contextだけlocalhost:3000を固定。`PLAYWRIGHT_BASE_URL`を共有。
4. scene遷移中のGLB load完了がdisposed WebGL programへ触れる競合。render loopを即停止し、pending character/environment loadsをsettleしてからScene/Engineを破棄。対象連続3件で再発なし。
5. save toastは短時間で消えるため、永続結果であるreload後のcontinue表示を正本に変更。

## Runtime measurements

- desktop 1280×720: 60秒、平均59FPS、最低53FPS、p95 17.86ms。
- tablet equivalent 1024×640: 13秒、平均54FPS、最低10FPS、p95 20ms。
- scene: 501 meshes、88 materials、20 textures、37 animation groups。
- clean build: 26,510,719 bytes。stale build比59.67%削減。

## Visual evidence

`screenshots/90-point-rc/manifest.json`は39 entries。今回追加した4zone、production player、normal first loop、iPad-equivalentはcurrent source capture。zone画像のtest travelはscreenshot用途として明記し、normal journey証跡には使わない。

## Not verified

- 物理iPad / Android / low-end PC。
- 30〜45分の全normal journey。
- CPU 4倍、slow network、15分memory delta。
- required screenshotのmissing dedicated frames。
- bespoke facial animationと全game verb専用clips。

上記不足により厳格自己採点は89/100。
