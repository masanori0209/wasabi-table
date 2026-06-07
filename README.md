# Wasabi Table

高速で軽量な Excel 風テーブルコンポーネント。Rust + WebAssembly で構築され、Canvas API を使用してレンダリングします。

## プロジェクト構成

```
wasabi-table/
├── src/              # Rust コア（WASM にコンパイル）
├── src-ts/           # TypeScript ラッパー・リスナー
├── dist/             # TypeScript ビルド出力
├── pkg/              # WASM ビルド出力（npm run build で生成）
├── e2e/              # Playwright E2E テスト
├── examples/         # 使用例・ライブデモ
└── docs/             # ドキュメント
```

## 主な機能

- **Canvas + WASM** による高性能レンダリング
- **Excel 風操作**: セル選択・範囲選択・キーボードナビゲーション
- **編集**: インライン編集・コピー&ペースト
- **フィルター・ソート**、条件付き書式、セルバリデーション
- **テーマ**: light / dark

## クイックスタート

### 前提条件

- Node.js 18+
- Rust 1.70+
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### インストール・ビルド

```bash
npm install
npm run build    # pkg/ + dist/ を生成（初回必須）
```

### 基本的な使用方法

```typescript
import { WasabiTable } from 'wasabi-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const table = await WasabiTable.create(canvas);

table.setCellValue(0, 0, 'Hello');
table.setCellValue(0, 1, 'World');
table.render();
```

### リスナー統合（数式バー・統計表示）

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

# E2E テスト（ビルド + ローカルサーバー自動起動、失敗時に動画・trace 保存）
npm run test:e2e

# ブラウザ表示しながら E2E（録画あり）
npm run test:e2e:record

# E2E レポート表示
npm run test:e2e:report

# Rust WASM ブラウザテスト（Firefox 必要）
npm run test:rust
```

## 開発

```bash
npm run dev          # TypeScript ウォッチ
./build.sh           # WASM + TS フルビルド
```

WASM を変更した場合は `npm run build:wasm` または `npm run build` を再実行してください。

## ドキュメント

- [Getting Started](./docs/getting-started.md)
- [Core API](./docs/api-core.md)
- [使用例](./examples/usage-examples.md)

## ライセンス

[MIT](./LICENSE)
