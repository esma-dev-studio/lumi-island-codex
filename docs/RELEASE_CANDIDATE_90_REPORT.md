# Lumi Island 90 Point RC Report

作成日: 2026-08-03
判定: **82 / 100 — 条件付きRelease Candidate。90点未達。**

## outcome

今回の価値は、見た目だけの加点ではなく、進行とsaveを壊すP0を除き、タイトルの品質と子どもの誤操作防止を実画面で確認したこと。ImageGenは4点を生成したが、ゲーム内加点は実装した1280×720 WebP 1点だけ。

## implemented and browser-verified

- original four-zone world artをtitleへ統合。
- 既存saveではcontinueをprimary表示。
- new gameは「記録が消える」confirmation必須。backでsave継続可能。
- 1280×720、1024×768でtitle overflowなし。
- tablet gameでthird-person character、objective、menuがviewport内。
- fix後fresh tabのconsole error/warning 0。

## implemented but not physical-device verified

- easy modeをnew player defaultへ。
- 主要補助buttonに44px minimum。
- shared Babylon materialをmesh disposeから保護。
- title WebPを168,146 bytesへ最適化。
- 100%後のcontinuation objective。

## verified by tests

- old saveから25/50/75 collection milestoneを復元、二重rewardなし。
- reachable hintだけ販売し、重複時はchargeなし。
- real NPC talkがdaily goalへ接続しrewardは1回。
- npm ci（522 packages）、83 unit tests、typecheck、lint、production build passed。

## external asset blocked

- production player/NPC GLB。現行4体は全てCharacter Gate failed。
- rights-cleared high-quality environment GLB/texture production。

## unimplemented or incomplete

- 4独立3D zoneと35〜55秒world traversal。
- zone-specific ambient/audio/camera arrival。
- normal-speed 30〜45 minute Journey。
- physical iPad/low-end performance measurement。
- screenshot manifestのmissing場面。
- IslandScene responsibility splitとlargest chunk削減。

## score

| 領域 | 配点 | 得点 | 根拠 |
|---|---:|---:|---|
| コアループ・進行・経済 | 20 | 19 | P0 save、hint、talkを修正。通常時間実測は不足 |
| ワールド・探索・解放 | 15 | 11 | 行動解放は成立。4独立terrain未達 |
| 3D・アート・animation・音 | 20 | 11 | Visual Masterと実装title、既存音。production GLB未達 |
| 小学2年生向けUX | 15 | 14 | easy default、save保護、44px、1目的。児童test未実施 |
| game feel・演出 | 10 | 8 | 既存mini-gameとday/night。zone演出不足 |
| code・test・performance | 15 | 14 | 83 unit、build、browser。performance実測とfull current E2E不足 |
| 独自性・安全性・license | 5 | 5 | original/CC0、provenance明記 |
| **総合** | **100** | **82** | **90 gate未達を反映** |

## save migration

save versionは5のまま。新field追加ではなく、sanitize時にcollectionCountsからmissing milestoneを復元するrepair migration。旧save位置、inventory、lumen、unlock flagを維持し、復元だけではrewardを再付与しない。

## changed areas

- state/progression/economy: gameState、FriendshipSystem、ProgressionDirector、UnlockCatalog、EconomySystem。
- rendering: IslandScene material ownership。
- UX/art: TitleScreen、release-candidate.css、generated asset。
- evidence: tests、artifacts、prompts、screenshots、docs、repo-local skill。

90点へ必要な外部成果物と次工程は docs/90_POINT_BLOCKERS.md を参照。
