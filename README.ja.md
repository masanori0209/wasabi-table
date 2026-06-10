# Wasabi Table

[English](./README.md)

Rust と WebAssembly で構築された、Canvas 上に描画する高速・軽量な Excel 風テーブルコンポーネントです。**SaaS 管理画面のマスタ一覧/編集**向けに、シンプルに始めて段階的に深掘りできる API を提供します。

## 使い方の 3 Tier

| Tier | 用途 | 例 |
|------|------|-----|
| **1** | 最小表示（30秒） | `WasabiTable.create(canvas)` → `setCellValue` → `render()` |
| **2** | 業務画面 | 列定義・バリデーション、`createWasabiTableWithListeners` |
| **3** | 大規模データ | `dataSource.records`、フィルター/ソート、列リサイズ |

詳細: [docs/roadmap.ja.md](./docs/roadmap.ja.md) · [Getting Started](./docs/getting-started.ja.md)

## ベンチマーク

[benchmark.html](https://masanori0209.github.io/wasabi-table/examples/npm-package/benchmark.html) でブラウザ上の計測が可能です（100行〜100万行 records、初期化・スクロール等）。数値は環境依存 — 再現手順はページ内に記載。

## プロジェクト構成

```
wasabi-table/
├── src/              # Rust コア（WASM にコンパイル）
├── src-ts/           # TypeScript ラッパーとリスナー
├── dist/             # TypeScript ビルド出力
├── pkg/              # WASM ビルド出力（npm run build で生成）
├── e2e/              # Playwright E2E テスト
├── examples/         # 使用例とライブデモ
└── docs/             # ドキュメント
```

## 機能

- **Canvas + WASM** による高性能レンダリング
- **Excel 風操作**: セル選択、範囲選択、キーボードナビゲーション
- **編集**: インライン編集、コピー＆ペースト、カット、元に戻す/やり直し
- **フィルター・ソート**、条件付き書式、セル検証
- **列リサイズ**（ヘッダー端ドラッグ）
- **行選択**（行ヘッダークリック）、**列固定**（`freeze_cols`）
- **テーマ**: ライト / ダーク

## クイックスタート

### 前提条件

- Node.js 18+
- Rust 1.70+
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### npm パッケージ

```bash
npm install wasabi-table
```

**ブラウザ要件**: ES Modules 対応のモダンブラウザ（Chrome / Firefox / Safari / Edge の最新版）。Node.js 単体では動作しません（WASM + Canvas が必要）。

### ソースからビルド

```bash
npm install
npm run build    # 初回クローン時に pkg/ + dist/ を生成
```

### 基本的な使い方

```typescript
import { WasabiTable } from 'wasabi-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const table = await WasabiTable.create(canvas);

table.setCellValue(0, 0, 'Hello');
table.setCellValue(0, 1, 'World');
table.render();
```

### リスナー API（数式バー・統計）

```typescript
import { createWasabiTableWithListeners } from 'wasabi-table';

const { table, listeners } = await createWasabiTableWithListeners(
  canvas,
  { row_count: 50, col_count: 10 },
  {
    cellReferenceSelector: '#cellReference',
    formulaInputSelector: '#formulaInput',
    statsElementSelector: '#stats',
  }
);
```

### ライブデモ

- **オンラインデモ**: https://masanori0209.github.io/wasabi-table/examples/npm-package/index.html（`?lang=en` / `?lang=ja`）
- **ベンチマーク**: https://masanori0209.github.io/wasabi-table/examples/npm-package/benchmark.html
- **ローカル**:

```bash
npm run build
npm run serve
# http://localhost:8501/examples/npm-package/index.html
```

## テスト

```bash
# 全テスト（ユニット + Rust + E2E）
npm run test:all

# TypeScript ユニットテスト
npm run test:unit

# E2E テスト（ローカルサーバーを自動起動、失敗時に動画/trace を保存）
npm run test:e2e

# ブラウザ表示付き E2E（録画有効）
npm run test:e2e:record

# E2E レポートを開く
npm run test:e2e:report

# Rust WASM ブラウザテスト（Firefox が必要）
npm run test:rust
```

## 開発

```bash
npm run dev          # TypeScript ウォッチモード
./build.sh           # WASM + TS フルビルド
```

Rust/WASM の変更後は `npm run build:wasm` または `npm run build` を再実行してください。

## ドキュメント

- [ドキュメント一覧](./docs/README.md)（製品方針・ロードマップ・アーキテクチャ含む）
- [Getting Started](./docs/getting-started.md) · [はじめに](./docs/getting-started.ja.md)
- [Core API](./docs/api-core.md) · [コア API](./docs/api-core.ja.md)
- [Usage Examples](./examples/usage-examples.md) · [使用例](./examples/usage-examples.ja.md)
- [グリッド選定ガイド](./docs/choosing-a-grid.ja.md) · [Browser support](./docs/browser-support.ja.md)

## バンドルサイズ（目安）

`npm run build` 後の参考値（gzip 前）:

| 成果物 | サイズ |
|--------|--------|
| WASM (`pkg/wasabi_table_bg.wasm`) | ~1.2 MB |
| JS ラッパー (`dist/`) | ~250 KB |

WASM は初回ロード時にキャッシュされます。Tree-shaking 対象外のため、必要 API のみ import しても WASM 本体は同梱されます。

## 1.0 スコープ外

- 数式エンジン（`=SUM` 等）— 数式バーはセル値エディタ
- ピボット・チャート
- セル結合、リアルタイム共同編集
- SSR / Node.js 単体実行
- 公式 React パッケージ（docs + サンプルのみ）

詳細: [positioning.ja.md](./docs/positioning.ja.md)

## セキュリティ

- API キー、トークン、`.env` などの秘密情報は **コミットしないでください**
- ローカル環境変数のテンプレートは [`.env.example`](./.env.example) を参照
- 脆弱性の報告は [GitHub Issues](https://github.com/masanori0209/wasabi-table/issues) へ

## ライセンス

[MIT](./LICENSE)
