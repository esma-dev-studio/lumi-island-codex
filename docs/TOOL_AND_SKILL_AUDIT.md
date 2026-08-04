# Tool and Skill Audit

監査日: 2026-08-03

| 項目 | 状態 / バージョン | 今回の実使用 | 動作結果 / 代替 |
|---|---|---|---|
| ImageGen skill | available | 4-zone texture atlasを生成 | source保存、4 WebPへ最適化しゲーム統合 |
| Browser skill | available | local live scene、DOM、console、telemetry、視覚QA | desktop実画面で確認 |
| OpenAI docs skill | available | Codex/ImageGen/browser game手順の確認 | 公式情報だけを参照 |
| Skill creator | available | repo-local review skill | validation済み |
| Subagents | available | progression、UX/QA、world/performance独立監査 | 3系統の監査を統合 |
| Screenshot capture | available | 4 zones、normal loop、iPad横 | PlaywrightとBrowserで保存・目視 |
| Node.js | 24.12.0 | build、asset import、tooling | success |
| npm | 11.6.2 | scripts | success |
| Vitest | 4.1.10 | logic regression | 88/88 success |
| Playwright | 1.62.0 | normal journey、visual、touch、performance | success on executed suites |
| TypeScript | 5.9.3 | typecheck | success |
| Babylon.js | 9.18.1 | 3D runtime | build/live browser success |
| glTF Validator | 2.0.0-dev.3.10 | 4 character GLB gate | 4/4 error 0 |
| sharp | 0.35.3 | atlas crop、WebP optimization | success |
| Blender | unavailable | bespoke animation/face制作候補 | Quaternius CC0 production packで代替、専用clipは残課題 |
| ffmpeg | unavailable | audio/video conversion | procedural Web Audioを採用 |
| ImageMagick / cwebp | unavailable | image optimization | sharpで代替 |
| Sites building/hosting | available | clean build packageとproduction deployment | mandatory workflow |

実装環境に `.openai/hosting.json` があるため、配信はSites building/hosting手順を使用する。利用していない機能は利用済みとして数えていない。
