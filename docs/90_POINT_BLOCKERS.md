# 90 Point Blockers

厳格な自己採点は89/100。コード品質の素点は90点台相当まで改善したが、添付評価基準の必須ゲートに未達があるため90点とは報告しない。

## 解消した旧blocker

- 4体のplaceholder GLBをQuaternius CC0 production modelへ置換。
- Character technical gate: UV、texture、multi-joint weights、32 joints、Khronos error 0、目視review passed。
- 4つの明確なzone、2.45倍以上のworld bounds、別texture、landmark、ambient profileを実装。
- Kenney CC0 environment GLB 8点を10配置し、実ブラウザで10/10読込。
- 通常速度の初回ループをワープ・速度倍率・進行注入なしで完走。
- desktopとtablet相当のFPS/p95/scene countを提出。
- Unit 88、typecheck、lint、build、追加E2Eを成功。
- stale build hashを除去しdistを59.67%削減。

## 90点を止める必須gate

1. **専用キャラクター表現**
   - 現在のCC0 packは技術ゲートを通るが、表情モーフとFish/Mine/Craft/Talk/Celebrate専用clipがない。
   - ゲーム側はPickUp、Punch、Spell等へ意味動作を対応付けており、「最低9専用animation」の厳格条件を完全には満たさない。
   - Blender等で追加clipと顔差分を制作・受入する必要がある。

2. **30〜45分の通常速度Journey**
   - 初回6.6分の採取→工作→配置→会話→購入→保存は完走。
   - 港専用魚2種、図鑑50/75%、夜の庭、親密度2/3、作業場、日替わりまでを通常速度だけで連続完走する試験は未完。

3. **実機・長時間性能**
   - desktop 59FPS、tablet相当54FPSは測定済み。
   - 物理iPad、CPU 4倍、低速回線、15分memory deltaは未測定。

4. **必須画像の完全性**
   - 新しい4zone、production player、iPad横、normal first loopは取得。
   - sunset、修復前後の一部、橋横断途中、親密度2/3、作業場、25%、daily、low-performanceの専用frameが不足。

## code/art debt

- `IslandScene.ts` は約1,500行で、camera、NPC、world syncの追加分割余地がある。
- largest client chunk 886,761 bytes。以前より縮小したが500k warning継続。
- 家と一部landmarkはprimitive主体で、camera angleによって前景が大きく占有する場面がある。
- tablet最低10FPSは初期asset loadの落込み。preloadとprogressive activationの余地がある。

上記を実成果物と測定で満たすまで、採点を90へ丸めない。
