# QA Evidence 90

検証日: 2026-08-03

| check | result | evidence/limit |
|---|---|---|
| npm test | 83/83 passed | 7 files |
| npm ci | passed、522 packages | Sites互換lockfileへ正規化後 |
| typecheck | passed | tsc --noEmit |
| lint | passed | eslint |
| production build | passed | Vinext; >500k chunk warning |
| Character Gate | failed as expected | 4 placeholder GLB、Khronos error各4 |
| existing Playwright suite | 19 passed in earlier same-day RC evidence | 今回変更後の全件再実行はしていない |
| current browser title | passed | 1280×720 |
| current browser tablet | passed | 1024×768 |
| save protection | passed | dialog visible、back keeps continue |
| fresh console | 0 error / 0 warning | fix後の新規browser tab |
| horizontal overflow | none | desktop/tablet title and tablet game |
| repo skill validation | passed | Skill is valid! |

## browser regression found and fixed

最初のImageGen title統合で next/image がVinext devのreact JSX runtime export errorを起こした。browser screenshotで検出し、CSS backgroundへ変更。fix後のfresh tabはconsole 0件。

## screenshot evidence

screenshots/90-point-rc/manifest.json にcurrent-live-browser、regression-e2e、missingを分離した。現在の新規captureはtitle、new-game confirmation、tablet title、tablet game。既存E2E画像13枚を明示的に再利用した。未取得場面はmissingで、追加captureとして数えない。

## failed / not run

- production Character Gateは失敗。これはknown blockerで成功扱いしない。
- browser接続の最初の127.0.0.1指定は環境のIPv6 bindと合わず、localhostへ切替。
- current change後のPlaywright 19件full rerunは未実施。
- physical iPad、low-end device、FPS/memory、normal-speed 30〜45 minute journeyは未実施。
