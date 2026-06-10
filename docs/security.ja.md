# セキュリティ

[English](./security.md)

脆弱性の報告、開発上のセキュリティ方針、依存関係の扱いです。

## 報告窓口

セキュリティ上の問題は **GitHub Issues** で報告してください。

- リポジトリ: https://github.com/masanori0209/wasabi-table/issues
- 再現手順、影響範囲、環境（ブラウザ/OS）を含めると対応が早くなります
- 公開前に修正したい重大な問題は、Issue タイトルに `[security]` を付けてください

（将来的に `SECURITY.md` をルートに置く場合は本 doc からリンク）

## 既知の対策（CHANGELOG 参照）

| 項目 | 対応 |
|------|------|
| バリデーションツールチップ XSS | ユーザー入力を `innerHTML` ではなく `textContent` で表示（v0.1.0） |
| 公開ビルド | wasm-opt、debug log  stripping、source map 非公開方針 |
| 秘密情報 | `.env` 等を `.gitignore`。テンプレートは [`.env.example`](../.env.example) |

## 開発上の方針

### ユーザー入力

- DOM に載せる文字列は **エスケープ済みテキスト** として扱う（`textContent`, `createTextNode`）
- 列バリデーションエラーメッセージも同様
- 将来 HTML セル表示を追加する場合はサニタイズ方針を本 doc に追記

### WASM / サply chain

- Rust 依存: `Cargo.lock` をコミット
- npm 依存: `package-lock.json` をコミット
- CI: `npm ci` でロックファイル固定

### 依存関係の更新

- `npm audit` / `cargo audit`（導入時）を定期確認
- devDependencies の CVE は [CHANGELOG](../CHANGELOG.md) v0.1.x で対応実績あり
- パッチ適用 PR ではテスト全実行（`npm run test:all`）

### 公開パッケージ内容

`npm pack` に含まれるのは主に:

- `dist/`, `pkg/*.wasm`, README, LICENSE, CHANGELOG

`examples/`, `e2e/`, ソースは **npm に含まれない**。詳細: [publishing-checklist.ja.md](./publishing-checklist.ja.md)

## 秘密情報ポリシー

- API キー、トークン、`.env` を **コミットしない**
- npm publish トークンは GitHub Secrets のみ
- Public 化後、git 履歴にメールアドレスが残る — GitHub のプライバシー設定を確認

推奨: 公開前に `gitleaks detect` 等で履歴スキャン（[publishing-checklist](./publishing-checklist.ja.md) Phase 0）

## ブラウザ側の注意

- Clipboard API は権限・HTTPS に依存
- Wasabi はサンドボックス内 WASM — **任意コード実行 API は提供しない**
- 読み込む WASM は同一オリジンまたは bundler 経由の信頼できる `pkg/` のみ使用

## 1.0 前チェックリスト

- [ ] ツールチップ・MenuField 等 DOM 注入箇所の再監査
- [ ] `npm audit` クリティカル無（または documented exception）
- [ ] gitleaks / 秘密情報スキャン（推奨）
- [ ] SECURITY 報告窓口が README から辿れる

## 関連

- [Design principles — 安全](./design-principles.ja.md#8-安全と明示的な破壊)
- [Publishing checklist](./publishing-checklist.ja.md)
