# Progression Reachability 90

更新日: 2026-08-03

## thresholds

| milestone | required | available before gate | result |
|---|---:|---:|---|
| 25% | 5/18 | village/pond sources | reachable |
| 50% | 9/18 | normal sources | reachable; harbor opens |
| 75% | 14/18 | normal + harbor + bridge islet | reachable before night garden |
| 100% | 18/18 | night garden + remaining fish | finite |

魚抽選はspot、day、time、catch count、discovery state、weight、fixed seedを使用する。既存の機能接続E2Eは空セーブから18/18へ到達済みだが、test supportを使うため通常速度証跡とは分ける。

## normal-speed evidence

`e2e/normal-speed-journey.spec.ts` は `?e2e`、座標テレポート、速度3倍、時間10倍、localStorage進行注入を使わない。実際の歩行で次を6.6分で完走した。

1. 新規ゲーム。
2. 目的の木まで歩く。
3. 採取ミニゲーム。
4. バッグを開く。
5. 小えだのいすを工作。
6. 家具配置。
7. ノラまで歩き、2段階会話。
8. 島づくりの最初の解放を購入。
9. 手動保存、再読込、つづきから表示。

これは初回ループの通常操作を証明する。30〜45分の図鑑50%・港・夜の庭・親密度3までを通常速度だけで連続完走する証跡ではない。

## regression coverage

- old saveから25/50/75 milestoneを再構成し、二重報酬なし。
- hint購入は現在到達可能な未発見項目だけを候補にし、空候補時は課金なし。
- resident talkはdaily goalへ接続し、rewardは1回。
- 100%後はfriendship/daily continuationへ目的を切替。
- 4ゾーンの定義、texture、ambient profile、2.45倍以上のworld boundsをunit test。
- Unit suite: 88/88 passed。

## remaining gate

通常速度で30〜45分の中間到達点まで連続し、港専用魚2種、図鑑50/75%、夜の庭、ノラ親密度2/3、作業場、日替わりを完走するJourneyが未完。このため厳格な90点判定は保留する。
