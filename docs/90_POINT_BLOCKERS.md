# 90 Point Blockers

現在の自己採点は82/100。以下が残るため90点とは報告しない。

## 必須gate

1. **Production character GLB**
   - playerと主要NPC全員についてUV、画像texture、自然なmulti-joint weight、正常hierarchy、9専用animation、表情、rights、Khronos error 0が必要。
   - 現行4体はintegration-placeholder。Blender環境も今回利用不可で、外部character modeler/animator成果物が必要。

2. **4つの独立した3D zone**
   - 現行worldは実質1楕円島で端間約9秒。
   - 中央集落を残し、森、港、橋先を別terrain/height/ambient/interactionとして2.5〜3倍へ拡張する必要。

3. **Production environment quality**
   - primitive中心の家、木、岩、家具を権利確認済みmodular GLB/texture/atlasへ段階置換。
   - port2地点、forest新通路、islet昼夜差を視覚と行動の両方で実装。

4. **Normal-speed Journey**
   - teleport、3x movement、10x time、state injectionなしで30〜45分導線を連続検証。
   - initial action≤90秒、craft 5〜8分、first unlock 12〜20分を実測。

5. **Performance evidence**
   - physical iPad/low-end PCでaverage/min FPS、p95 frame、load、interactive、draw calls、mesh/material/texture、15分memory、tab resumeを測定。

6. **Evidence completeness**
   - screenshot manifestでmissingのsunset、before states、bridge crossing、friendship2/3、workshop、25%、daily、low-performance等を実画面取得。

## code debt

- IslandScene.ts 約1,500行の責務分割。
- CharacterView client chunk 1,026,065 bytesのcode split。
- debug-assisted E2Eとnormal Journeyの明確なsuite分離。
- zone ambient audioとtab hidden pauseの実測。

これらは仕様を小さくして回避せず、成果物と測定を揃えた時点で再採点する。
