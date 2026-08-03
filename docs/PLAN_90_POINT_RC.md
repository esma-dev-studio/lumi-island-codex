# Plan 90 Point RC

## 完了

- [x] tools/skills/CLI監査
- [x] 進行・UX/QA・world/performanceの独立監査
- [x] 旧saveの図鑑milestone復元
- [x] 実会話とdaily talkの接続
- [x] 重複/到達不能ヒントの課金防止
- [x] 保存済み新規ゲームの確認画面
- [x] easy modeを新規プレイヤー既定に変更
- [x] 100%後の目的表示を有限化
- [x] 共有Material破棄の修正
- [x] Visual Master 4点生成、prompt/manifest/provenance記録
- [x] world mapのWebP最適化とタイトル統合
- [x] 83 unit、typecheck、lint、build
- [x] current browser QAとscreenshot manifest
- [x] repo-local review skill

## 次の実装phase

1. 既存島を中央集落として維持し、Forest/Harbor/Isletを別terrain chunkへ拡張。
2. ZoneRegistry、WorldBuilder、LightingControllerを IslandScene.ts から抽出。
3. zone固有ambient loopと到着名表示、2〜4秒以内のcamera cueを追加。
4. ImageGen masterを基に、権利確認済みenvironment GLB/textureを制作・導入。
5. 制作会社またはモデラーからproduction character/NPC GLBを受領しCharacter Gateを通す。
6. teleport/3x speed/10x timeを使わない連続Journeyを追加。
7. 実iPad/低性能端末でFPS、p95 frame、memoryを15分測定。

## release判定

現在は「82点・条件付きRC」。90点releaseへ昇格する条件は 90_POINT_BLOCKERS.md の全項目解消。
