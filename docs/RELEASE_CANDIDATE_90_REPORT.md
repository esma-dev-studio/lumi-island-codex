# Lumi Island 90 Point RC Report

作成日: 2026-08-03
判定: **89 / 100 — 大幅改善済み。ただし厳格な90点必須ゲート未完。**

公開先: https://lumi-island-game.neon-acorn-2741.chatgpt.site

## outcome

旧82点RCの最大blockerだったplaceholder character、単一島感、primitive中心環境、zone音響なし、性能未測定、通常速度証跡なしを実装で改善した。技術・実画面の素点は90点台に届く構成だが、専用キャラクターanimation、30〜45分normal journey、物理tablet/長時間性能が不足するため89点とする。

## 実装済み・実画面確認済み

- Quaternius CC0のRanger/Monk/Rogue/ClericをMira/Nolla/Kai/Seraへ統合。third-person playerが可視。
- 4 GLBはUV、画像texture、32 joints、multi-joint weights、11〜14 animations、Khronos error 0。
- ひかりの広場、こもれびの森、さんごの港、月しずくの庭の4zone。
- 4種類のImageGen WebP terrain texture、zone badge、landmark、固有ambient profile。
- Kenney Nature Kit CC0の橋、木、丸太、石段、岩、カヌー等を10配置し、runtime 10/10。
- iPad横相当で現在地、1目的、touch移動、バッグ、工作が同時に表示。
- desktop平均59FPS、tablet相当平均54FPS、console error 0。
- `dist`のstale hash混入を防ぎ、65.7MBから26.5MBへ59.67%削減。

## 通常速度で確認済み

`e2e/normal-speed-journey.spec.ts` は `?e2e`、teleport、3x movement、10x time、progress state injectionなし。実歩行で採取、工作、配置、ノラ会話、最初の解放購入、保存、再読込を6.6分で完走。

## テスト・静的検証

- Vitest: 8 files / 88 tests passed。
- TypeScript: passed。
- ESLint: passed。
- Production build: passed。500kB超chunk warningあり。
- Character Gate: 4/4 passed、Khronos error 0。
- 4-zone visual E2E: 2/2 passed。
- iPad相当performance E2E: passed、平均54FPS。
- Save migrationはversion 5を維持。旧saveの位置、inventory、lumen、unlockを保持し、missing milestoneだけをidempotentに復元。

## 採点

| 領域 | 配点 | 得点 | 根拠 |
|---|---:|---:|---|
| コアループ・進行・経済 | 20 | 18 | 初回normal loopと100%有限到達test。30〜45分normal完走は未達 |
| ワールド・探索・解放 | 15 | 14 | 4 zone、2.45倍以上、landmark、texture、ambient。高低差と固有行動の深さに余地 |
| 3D・アート・animation・音 | 20 | 17 | production CC0 character/environment、ImageGen texture、zone音。表情と専用clip不足 |
| 小学2年生向けUX | 15 | 14 | やさしい表示、1目的、ふりがな、44px、touch。実児童testなし |
| game feel・演出 | 10 | 8 | third-person avatar、mini-game、zone arrival/音。cameraと解放演出に余地 |
| code・test・performance | 15 | 13 | 88 unit、type/lint/build、normal/visual E2E、FPS提出。長時間/実機/chunk課題 |
| 独自性・安全性・license | 5 | 5 | original/CC0、provenance、unknown license 0 |
| **総合** | **100** | **89** | **不足を90へ丸めない** |

## 90点到達に必要な最短工程

1. 現行rigへ表情差分とFish/Mine/Craft/Talk/Celebrate専用clipを追加し再gate。
2. 通常速度Journeyを複数の連続suiteへ分割し、30〜45分中間到達点まで完走。
3. 物理iPadで主要導線、15分memory、tab復帰、最低FPSを測定。
4. 必須screenshotのmissing場面を専用stateと手順付きで取得。

詳細は `docs/90_POINT_BLOCKERS.md` と `docs/QA_EVIDENCE_90.md`。
