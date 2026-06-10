# プロジェクト整理バックログ

[English](./project-backlog.md)

docs 整備の進捗一覧。実装タスクは [roadmap.ja.md](./roadmap.ja.md) を参照。

## 整理済み（docs）

| ドキュメント | 内容 |
|--------------|------|
| [positioning.ja.md](./positioning.ja.md) | 製品定義、差別化、競合記述ルール、Tier 動線、スコープ外 |
| [roadmap.ja.md](./roadmap.ja.md) | **確定版** — persona / Must UX / Release Train |
| [architecture.ja.md](./architecture.ja.md) | Rust/TS 分界、データモデル、viewport 同期 |
| [api-stability.ja.md](./api-stability.ja.md) | 公開 API、semver、deprecated |
| [design-principles.ja.md](./design-principles.ja.md) | PR 判断基準 |
| [choosing-a-grid.ja.md](./choosing-a-grid.ja.md) | 向く/向かない、カテゴリ選定 |
| [integrations.ja.md](./integrations.ja.md) | React、dispose、Strict Mode |
| [browser-support.ja.md](./browser-support.ja.md) | 対応ブラウザ、Node 非対応、a11y |
| [testing.ja.md](./testing.ja.md) | Vitest / cargo / E2E / CI |
| [security.ja.md](./security.ja.md) | 報告窓口、XSS、依存関係 |
| [CONTRIBUTING.ja.md](./CONTRIBUTING.ja.md) | 開発・PR・CHANGELOG |
| [getting-started.ja.md](./getting-started.ja.md) | インストール・最小例 |
| [api-core.ja.md](./api-core.ja.md) | 公開 API リファレンス |
| [publishing-checklist.ja.md](./publishing-checklist.ja.md) | npm 公開手順 |
| [CHANGELOG.md](../CHANGELOG.md) | リリース履歴 |

目次: [docs/README.md](./README.md)

## 未作成（1.0 直前まで）

| ドキュメント | タイミング |
|--------------|------------|
| `migration-1.0.ja.md` | v0.9 — 破壊的変更がある場合のみ |
| ルート `SECURITY.md` | 任意 — security.ja への短いリンク |

## README 側の TODO（docs 外）

| 項目 | 備考 |
|------|------|
| Tier 1/2/3 動線を README 冒頭に | [roadmap v0.2.0](./roadmap.ja.md#v020--saas-向け第一弾) |
| ベンチマーク結果の要約 + リンク | benchmark.html |
| docs 目次へのリンク | [docs/README.md](./README.md) |

## 方針（確定）

[roadmap.ja.md §2](./roadmap.ja.md#2-確定方針2026-06-時点)

| 項目 | 決定 |
|------|------|
| Primary persona | **SaaS 管理画面** |
| v1.0 Must UX | 列リサイズ / freeze / 行選択 / タッチ / records filter E2E |
| 目標時期 | フェーズのみ（日付なし） |
| React パッケージ | 1.0 時点 docs + サンプルのみ |

## リポジトリに入れない

競合機能表・勝敗分析 → Notion / ローカル（[positioning](./positioning.ja.md) 参照）
