# Child UX Audit

対象: 小学2年生が一人で最初の目的を理解し、誤操作から戻れるか。

| 導線 | 主操作数目安 | 読む量 | 迷い | 復帰 |
|---|---:|---|---|---|
| title→new game | 1 | 短い | save有無 | save有りは確認dialog |
| first objective | 0 | 20字前後 | 低 | 1件だけ強調 |
| walk/gather | 移動＋1 action | 短い | 対象距離 | world guide/easy mode |
| craft | menu→item→craft | 中 | 材料不足 | 不足copy |
| place furniture | select→move→confirm | 中 | valid位置 | cancel可能 |
| bridge/harbor/night garden | objective→移動→action | 中 | worldが狭く景観差弱い | next objective |
| collection | menu→collection | 中〜多 | 18項目 | panel内scroll |
| save/continue | menu→save / title→continue | 短い | 低 | confirmationあり |

## 今回の修正

- 新規saveのeasy mode既定をtrueへ変更。
- 既存saveがあると「つづきから」を主buttonへ。
- 「あたらしく始める」は島の記録が消える確認を必須化。
- confirmation buttonは実測56.4px高。
- building tabs等へ44px minimumを追加。
- 100%後に「まだ探せ」と表示し続けない。
- real resident talkがdaily goalへ進むよう接続。

## 実画面

1280×720と1024×768でtitleのhorizontal/vertical overflowなし。tablet title actionは幅348px、高さ54〜56px。game画面はthird-person characterが見え、objectiveとbottom menuがviewport内に収まった。物理iPadの指操作、読み上げ、7歳児usability testは未実施。
