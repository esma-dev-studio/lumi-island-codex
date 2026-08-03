# Tool and Skill Audit

監査日: 2026-08-03

| 項目 | 状態 / バージョン | 今回の用途 | 動作確認 | 代替 |
|---|---|---|---|---|
| ImageGen skill | 利用可能 / gpt-image-2系 | Visual Master 4点 | 4点生成済み | なし |
| Browser skill | 利用可能 | ローカル実画面、レスポンシブ、console | 1280×720 / 1024×768で確認 | Playwright CLI |
| OpenAI docs skill | 利用可能 | Codex、ImageGen、browser game、skills仕様 | 公式マニュアルを確認 | 公式OpenAIサイト |
| Skill creator | 利用可能 | repo-local review skill | initとquick_validate成功 | 手動チェックリスト |
| Subagents | 利用可能 | 進行、UX/QA、world/performance独立監査 | 3系統で実施 | メイン監査 |
| Screenshot capture | 利用可能 | 現行タイトル等4枚＋既存E2E証跡整理 | 保存・表示確認済み | Playwright test |
| Node.js | 24.12.0 | build/test/asset metadata | 成功 | なし |
| npm | 11.6.2 | scripts | 成功 | なし |
| Vitest | 4.1.10 | logic regression | 83/83成功 | なし |
| Playwright | 1.62.0 | 既存E2E、mobile emulation | 既存19件の証跡あり。今回全件再実行なし | Browser skill |
| TypeScript | 5.9.3 | typecheck | 成功 | なし |
| Babylon.js | 9.18.1 | 3D runtime | buildと実画面で確認 | なし |
| glTF Validator | npm package 2.0.0-dev.3.10 | Character Gate | 4 GLBを再検証、意図どおりfailed | 外部DCCレビュー |
| sharp | 0.35.3 | PNG→WebP最適化、metadata | 1280×720 WebP生成 | cwebp |
| Blender | 利用不可 | 本番GLB制作 | 未検出 | 外部3D制作 |
| ffmpeg | 利用不可 | 音声・映像変換 | 未検出 | 外部変換工程 |
| ImageMagick / cwebp | 利用不可 | 画像圧縮 | 未検出 | sharp |

実装環境に .openai/hosting.json があるため、配信はSites手順を使う。専用Skillは .agents/skills/lumi-island-review に作成し、公式validatorで Skill is valid! を確認した。
