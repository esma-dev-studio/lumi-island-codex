# Plan 90 Point RC

## 完了

- [x] tools/skills/CLI監査と3系統の独立監査
- [x] 旧save milestone復元、hint課金防止、daily talk、100%後objective
- [x] save保護、easy mode既定、44px touch、1目的HUD
- [x] ImageGen Visual Masterと4zone texture atlas、prompt/provenance
- [x] 中央広場・森・港・月しずくの庭の4zone、2.45倍以上のbounds
- [x] zone badge、4 ambient profile、landmark、tab非表示音停止
- [x] Quaternius CC0 production characters 4体とCharacter Gate pass
- [x] Kenney CC0 environment GLB 8点・10配置
- [x] normal-speed first loopをteleport/倍率/state injectionなしで完走
- [x] desktop/tablet相当FPS・p95・scene count測定
- [x] 88 unit、typecheck、lint、build、visual/touch E2E
- [x] stale dist cleanupで公開成果物59.67%削減
- [x] 4zone、normal loop、iPad相当screenshot更新

## 90点へ残る工程

1. 現行rigへ表情差分とFish/Mine/Craft/Talk/Celebrate専用clipを追加。
2. 30〜45分のnormal journeyを複数の連続suiteへ分割し、港、図鑑50/75%、夜の庭、親密度3まで完走。
3. 物理iPadで主要導線、15分memory、tab復帰、最低FPSを測定。
4. missing screenshotを専用state、日時、操作手順付きで取得。
5. largest client chunkを500kB未満へ段階分割し、IslandScene責務を追加分離。

## release判定

現在は厳格89/100。旧blockerの大半は解消したが、添付基準が「animation、normal play E2E、performance evidenceのいずれか不足なら90点以上禁止」と定めるため、未達を丸めない。詳細は `90_POINT_BLOCKERS.md`。
