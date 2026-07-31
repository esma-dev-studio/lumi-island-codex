# Current limitations

Phase 2.3時点の既知の制約です。

- キャラクターGLBは、スキン・ジョイント・アニメーションクリップの統合確認用に生成した仮素材です。高品質な本番キャラクターではありません。
- 現行GLBにはUV0と画像テクスチャがなく、複数関節ウェイト頂点は0、Khronos errorがあります。`assetStatus`は`integration-placeholder`で、`artifacts/character-gate-phase2-3.json`の本番受入ゲートは`failed`です。
- 島の環境はプロジェクト内のプロシージャル形状です。外部の高品質環境アセットは使っていません。
- ログイン、クラウドセーブ、課金、マルチプレイ、オンラインランキング、バックエンド同期はありません。
- セーブはブラウザのlocalStorageのみです。端末やブラウザをまたいだ移行はできません。
- PC ChromeとPlaywright Chromiumを主な検証対象としています。タッチ入力ロジックは自動テスト済みですが、iPad / Android実機の網羅的な操作感確認は今後の課題です。
- Babylon.jsのdeep importで最大クライアントJSを5,471,685 bytesから1,026,065 bytesへ削減しましたが、500KB警告は残ります。クリーンmanifest内JSは3,458,150 bytes、GameCanvas初期staticは1,867,012 bytesです。
- CPU低速化・通信制限条件の初回HTML、操作可能時間、総転送量、平均/最低FPS、メモリ傾向は、同一条件で再現できる自動測定が未整備です。目視値や推測値を性能合格として報告しません。
- 効果音はCC0 OGGです。BGM、環境音、音声読み上げはありません。
- 継続進行は、初期依頼後の日替わり、図鑑節目、複数の島解放、ノラの3段階親密度までです。クラウド運営や長期イベントはありません。
- Phase 2.3の完全E2EはPC ChromiumのソフトウェアWebGLで約4分8秒かかります。GPU・端末差による開始時間の揺れを考慮した待機を使っています。

本番GLBの条件と差し替え手順は`CHARACTER_ASSET_REQUIREMENTS.md`と`CHARACTER_PRODUCTION_BRIEF.md`を参照してください。経済・性能・テストの実測は`ECONOMY_BALANCE.md`、`PHASE2_3_REPORT.md`、`artifacts/phase2-3-metrics.json`を正本とします。