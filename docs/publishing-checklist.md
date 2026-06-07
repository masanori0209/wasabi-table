# リポジトリ公開・npm 公開チェックリスト

Private → Public 化および npm 初回公開前に確認する項目です。

## Phase 0: セキュリティ（必須）

- [x] 検証ツールチップ XSS 修正（#2）
- [x] 公開ビルドのハードニング（#3）
- [x] `.gitignore` 強化（#4）
- [ ] Git 履歴の秘密情報スキャン（推奨: `gitleaks detect`）
- [ ] `npm pack --dry-run` で公開ファイルを最終確認

## Phase 1: パッケージ品質

- [x] CHANGELOG.md 整備（#5）
- [x] devDependencies 脆弱性対応（#6）
- [ ] `npm publish --dry-run` でサイズ・内容を検証
- [ ] npm パッケージ名 `wasabi-table` の空き確認

## Phase 2: 公開インフラ

- [ ] GitHub リポジトリを Public に変更
- [ ] npm 組織・アカウントの 2FA 有効化
- [ ] `NPM_TOKEN` を GitHub Secrets に登録
- [ ] 公開 CI/CD ワークフロー有効化（#8）
- [ ] 初回タグ `v0.1.0` 作成と GitHub Release

## Phase 3: 公開後

- [ ] README のデモ URL 更新（#9）
- [ ] npm ページの説明文・キーワード確認
- [ ] Issue テンプレート・CONTRIBUTING.md（任意）

## 公開物に含まれるファイル（参考）

`npm pack --dry-run` 実行時の想定:

- `dist/` — TypeScript ビルド出力
- `pkg/wasabi_table*.wasm` — WASM バイナリ
- `README.md`, `LICENSE`, `CHANGELOG.md`

**含まれないもの**: `examples/`, `e2e/`, `src/`, `src-ts/`, テスト設定

## 秘密情報ポリシー

- `.env` やトークンは **絶対にコミットしない**
- テンプレート: [`.env.example`](../.env.example)
- npm publish トークンは GitHub Secrets のみで管理

## Git 履歴のプライバシー

Public 化後、コミット作者メールアドレスが履歴から読めます。必要に応じて GitHub のメールプライバシー設定を確認してください。
