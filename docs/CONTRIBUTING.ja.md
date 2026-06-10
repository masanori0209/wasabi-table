# コントリビューションガイド

[English](./CONTRIBUTING.md)

Wasabi Table への PR・Issue・ローカル開発の手順です。

## はじめに

- [設計原則](./design-principles.ja.md) と [ポジショニング](./positioning.ja.md) を一読してください
- バグ報告・機能要望: [GitHub Issues](https://github.com/masanori0209/wasabi-table/issues)
- セキュリティ: [security.ja.md](./security.ja.md)

## 開発環境

### 前提

- Node.js **18+**
- Rust **1.70+**
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- Playwright E2E: Chromium（`npx playwright install chromium`）

### 初回セットアップ

```bash
git clone https://github.com/masanori0209/wasabi-table.git
cd wasabi-table
npm install
npm run build    # pkg/ + dist/ 必須
```

### 日常開発

```bash
npm run dev              # TypeScript ウォッチ
npm run build:wasm       # Rust 変更時のみ
npm run build            # WASM + TS フルビルド
```

Rust / WASM を変更したら **`npm run build:wasm` 以上** を実行してから E2E やデモを確認してください。

### デモ

```bash
npm run serve
# http://localhost:8501/examples/npm-package/index.html
```

## テスト

PR 前に可能な限り:

```bash
npm run test:all
```

詳細: [testing.ja.md](./testing.ja.md)

| 変更箇所 | 最低限 |
|----------|--------|
| `src-ts/` ロジック | `npm run test:unit` |
| `src/` Rust | `cargo test` |
| ユーザー操作・UI | `npm run test:e2e` |
| 公開 API | 上記 + docs 更新 |

## PR ガイドライン

### スコープ

- 1 PR = 1 目的（機能 / 修正 / docs）
- [スコープ外](./positioning.ja.md#10-スコープ外明示する) 機能は Issue で議論してから

### コード

- 既存の命名・モジュール分割に合わせる
- 性能変更はベンチまたは再現手順を PR 説明に
- 不要な debug `console.log` は入れない（publish 前 strip あるが源を増やさない）

### ドキュメント

ユーザー向け変更は **日英ペア** を更新:

- `docs/*.md` / `docs/*.ja.md`
- 必要なら `README.md` / `README.ja.md`
- API 変更は `docs/api-core.*` と `CHANGELOG.md`

### CHANGELOG

[Keep a Changelog](https://keepachangelog.com/) 形式で `## [Unreleased]` に追記:

- `Added` / `Changed` / `Fixed` / `Deprecated` / `Security`

## コミットメッセージ

リポジトリの既存スタイルに合わせ、**英語または日本語** で変更の意図が分かる短い subject:

```
fix: records mode paste undo history
docs: add architecture overview
feat: column resize on header drag
```

## リリース（メンテナ向け）

- npm バージョンは `package.json` が正 — リリース時 `Cargo.toml` を同期
- [publishing-checklist.ja.md](./publishing-checklist.ja.md)
- タグ `v*` push で release workflow（`.github/workflows/release.yml`）

## ライセンス

コントリビューションは [MIT](../LICENSE) の下で提供されるものとみなします。

## 関連

- [Roadmap](./roadmap.ja.md)
- [API stability](./api-stability.ja.md)
