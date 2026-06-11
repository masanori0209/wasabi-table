# テスト戦略

[English](./testing.md)

Wasabi Table のテストレイヤと、CI・ローカル実行方法です。

## 方針

| 原則 | 内容 |
|------|------|
| 層ごとに適切なツール | 純 TS は Vitest、Rust は cargo、操作は Playwright |
| CI で再現 | `main` への push/PR で `npm run test:all` |
| ユーザー動線を E2E で固定 | リグレッションは E2E を優先 |
| 性能 | ベンチは手動/ページ + smoke E2E（数値断言は環境依存のため CI では緩め） |

## テストレイヤ

```
┌─────────────────────────────────────────┐
│  Playwright E2E (e2e/)                  │  ユーザー操作・統合
├─────────────────────────────────────────┤
│  Vitest (src-ts/*.test.ts)              │  TS 純粋ロジック
├─────────────────────────────────────────┤
│  cargo test (src/)                      │  Rust ユニット
├─────────────────────────────────────────┤
│  wasm-pack test --headless (src/tests)  │  WASM ブラウザ
└─────────────────────────────────────────┘
```

## Vitest（ユニット）

**対象例**

- `src-ts/filter-sort.test.ts` — フィルター/ソート
- `src-ts/utils.test.ts` — セル参照パース等
- `src-ts/records-data-source.test.ts` — records ヘルパ

```bash
npm run test:unit          # 一回
npm run test:unit:watch    # ウォッチ
```

環境: `vitest.config.ts`（happy-dom 等）

## Rust（cargo test）

```bash
cargo test
```

`src/` 内の validation 等、WASM 外でテスト可能なロジック。

## WASM ブラウザテスト

```bash
npm run test:rust
# wasm-pack test --headless --chrome
```

Firefox が必要な場合あり — ローカル環境に依存。

## Playwright E2E

**設定**: `playwright.config.ts`

- `baseURL`: `http://localhost:8501`
- `webServer`: `npm run build && npm run serve`（CI で自動起動）
- プロジェクト: **Chromium** のみ（CI）
- 失敗時: trace / video / screenshot

```bash
npm run test:e2e           # headless
npm run test:e2e:headed    # ブラウザ表示
npm run test:e2e:record    # 録画有効
npm run test:e2e:report    # HTML レポート
```

### E2E ファイルとカバー範囲

| ファイル | 主な内容 | Tier |
|----------|----------|------|
| `table.spec.ts` | 基本操作、数式バー、コピペ、undo | 1–2 |
| `edit-cycle.spec.ts` | 編集サイクル、キーボード | 2 |
| `undo-inline.spec.ts` | インライン undo | 2 |
| `records-data-source.spec.ts` | records 読み込み・viewport | 3 |
| `records-actions.spec.ts` | records 編集・dispose | 3 |
| `benchmark.spec.ts` | ベンチページ smoke | 3 |
| `demo-visual.spec.ts` | デモ UI  smoke | 1 |

**ローカライズ**: `data-testid` と API ベースの assertion（文言依存しない）

### Tier 1/2/3 と E2E の対応（目標）

| Tier | E2E で担保したいこと |
|------|---------------------|
| Tier 1 | create → setCellValue → render → 選択 |
| Tier 2 | listeners、バリデーション、フィルター UI |
| Tier 3 | records 100万行 smoke、ベンチページ起動 |

1.0 前: records + filter/sort の E2E 追加（[roadmap.ja.md](./roadmap.ja.md)）

## 全テスト一括

```bash
npm run test:all
# test:unit && cargo test && test:rust && test:e2e
```

CI（`.github/workflows/ci.yml`）と同じ順序。

## PR 時の期待

- ユーザー向け挙動変更 → **E2E 追加または更新**
- `filter-sort` / utils 変更 → **Vitest**
- Rust validation 変更 → **cargo test**
- 破壊的 API → docs + CHANGELOG

## ベンチマーク

- ページ: `examples/npm-package/benchmark.html`
- smoke: `e2e/benchmark.spec.ts`
- 数値比較 CI は行わない（マシン依存）。再現は benchmark ページ + docs

## 関連

- [CONTRIBUTING.ja.md](./CONTRIBUTING.ja.md)
- [Design principles — テスト](./design-principles.ja.md#9-テストは層ごとに)
