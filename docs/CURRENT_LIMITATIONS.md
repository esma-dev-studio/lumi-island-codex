# Current limitations

90点版Release Candidate時点の既知の制約です。

- Quaternius CC0の4キャラクターGLBは技術ゲートと目視reviewを通過。ただし表情モーフとFish/Mine/Craft/Talk/Celebrate専用clipはなく、既存clipへの意味対応を使います。
- Kenney CC0環境GLBを8点・10配置しましたが、家と一部landmarkは引き続きprimitive主体です。
- 4zoneはtexture、色、landmark、ambientで区別されますが、heightmapによる大きな高低差や完全に不規則な海岸線はありません。
- ログイン、cloud save、課金、multiplayer、online ranking、backend syncはありません。
- saveはbrowser localStorageのみ。端末やbrowserをまたいだ移行はできません。
- PC Chromiumとtablet相当touch emulationを検証。物理iPad / Android実機の網羅的な操作感確認は未実施です。
- desktop平均59FPS、tablet相当平均54FPS。tablet初期load時に最低10FPSを記録しました。
- clean buildの最大client chunkは886,761 bytesで、500kB warningが残ります。
- CPU 4倍、低速回線、15分memory delta、物理tabletの性能は未測定です。
- 通常速度E2Eは初回6.6分ループを完走。港、図鑑50/75%、夜の庭、親密度3までの30〜45分normal journeyは未完です。
- BGMと音声読み上げはありません。効果音はCC0、4zone ambientはproject original Web Audio synthesisです。
- required screenshotのうちsunset、修復前後の一部、橋横断途中、親密度2/3、workshop、25%、daily、low-performanceの専用frameが不足します。

最新の厳格判定は `RELEASE_CANDIDATE_90_REPORT.md`、残課題は `90_POINT_BLOCKERS.md`、性能は `PERFORMANCE_FINAL.md` を正本とします。
