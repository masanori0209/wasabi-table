# Wasabi Table — コア API

[English](./api-core.md)

Rust/WASM コアと TypeScript ラッパーの主要 API リファレンスです。

## 初期化

```typescript
import { WasabiTable, createWasabiTableWithListeners } from 'wasabi-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

// 基本
const table = await WasabiTable.create(canvas, { row_count: 50, col_count: 10 });

// 数式バー・統計・検証リスナー込み
const { table, listeners } = await createWasabiTableWithListeners(
  canvas,
  { row_count: 50, col_count: 10 },
  {
    cellReferenceSelector: '[data-testid="cell-reference"]',
    formulaInputSelector: '#formulaInput',
    statsElementSelector: '#stats',
  }
);
```

## セル操作

| メソッド | 説明 |
|----------|------|
| `setCellValue(row, col, value)` | セルに値を設定 |
| `getCellValue(row, col)` | セル値を取得 |
| `setCellValueWithValidation(row, col, value)` | 検証付きで設定 |
| `selectCell(row, col)` | セルを選択 |
| `getSelectedCell()` | 選択中セル `{ row, col }` |
| `getSelectionInfo()` | 単一/範囲選択の詳細 (`SelectionInfo`) |
| `render()` | キャンバスを再描画 |

## 列ヘッダー・検証

```typescript
table.setColumnHeaders(JSON.stringify([
  {
    name: 'email',
    display_name: 'メール',
    width: 180,
    required: true,
    field_type: 'EmailField',
    max_length: 100,
    min_length: 5,
    order: 0,
    is_visible: true,
  },
]));
```

| メソッド | 説明 |
|----------|------|
| `setColumnHeaders(json)` | 列定義を一括設定 |
| `getColumnHeaders()` | 列定義 JSON を取得 |
| `setColumnWidth(col, width)` | 列幅（px）を設定 |
| `getColumnWidth(col)` | 列幅（px）を取得 |
| `validateCellValue(col, value)` | 入力値を検証 |
| `getSelectedCellValidationError()` | 選択セルの検証エラー |

### フィールドタイプ

`CharField`, `EmailField`, `IntegerField`, `DecimalField`, `DateField`, `TimeField`, `BooleanField`, `MenuField` など。

日付は形式チェックに加え、暦上存在する日付かを検証します（例: `2023-02-30` は不可）。

## フィルター・ソート（TypeScript 層）

| メソッド | 説明 |
|----------|------|
| `addFilterCondition(condition)` | フィルター追加 |
| `removeFilterCondition(columnIndex)` | 列フィルター削除 |
| `clearAllFilters()` | 全フィルタークリア |
| `setSortCondition(condition \| null)` | ソート設定 |
| `getFilterState()` | 現在のフィルター/ソート状態 |
| `getFilterResult()` | フィルター後の行数など |

ロジックは `filter-sort.ts` に分離されており、単体テスト・再利用が可能です。

## 行・列・全選択

| メソッド / 操作 | 説明 |
|----------------|------|
| `selectColumn(col)` | 列全体を選択 |
| `selectRow(row)` | 行全体を選択 |
| `selectAll()` | シート全体を選択 |
| 列ヘッダー左側クリック | 列選択 |
| 列ヘッダー右端 `▾` クリック | フィルター/ソートダイアログ（列ヘッダー設定時） |
| 行ヘッダークリック | 行選択 |
| 左上角クリック | 全選択 |
| `Ctrl/Cmd+A` | 全選択 |

列ヘッダーは左側を**選択ゾーン**、右端 28px を**フィルター操作ゾーン**に分離し、フィルター UI と列選択の競合を避けます。

## クリップボード・編集

| 操作 | 説明 |
|------|------|
| `Ctrl/Cmd+C` | コピー |
| `Ctrl/Cmd+V` | ペースト |
| `Enter` / `F2` | セル編集開始 |
| `Shift+矢印` | 範囲選択 |
| 行ヘッダークリック | 行全体選択（Shift で拡張） |
| 列ヘッダー端ドラッグ | 列リサイズ |

コピー/ペーストは Excel 互換の TSV（`\r\n`）です。空行は保持され、Excel 由来の CRLF はペースト時に正規化されます。セル内のタブ・改行のエスケープは未対応です。

## 固定列

`TableConfig.freeze_cols` に固定するデータ列数（0 = なし）。列ヘッダー行・行番号列は常に固定表示。

```typescript
await WasabiTable.create(canvas, { row_count: 100, col_count: 20, freeze_cols: 1 });
```

## CSV 出力

```typescript
import { exportTableToCSV } from 'wasabi-table';

exportTableToCSV(table, 'export.csv');
```

スパースモードの表示セルを出力します（`records` 全件は対象外）。大規模データはアプリ側のデータ層からエクスポートしてください。

## テーマ

```typescript
table.applyTheme('dark');
table.applyTheme(WasabiTable.createCustomTheme('light', { background_color: '#f8f9fa' }));
```

## Rust / WASM 直接 API（参考）

| メソッド | 説明 |
|----------|------|
| `set_cell_data(row, col, value)` | データ HashMap に保存 |
| `add_conditional_format(row, col, json)` | セル単位の条件付き書式 |
| `set_filtered_rows(json)` | フィルター後の表示行 |
| `handle_canvas_wheel(dx, dy)` | スクロール |

データは `HashMap<"row:col", CellData>` に一本化されています。

## ビルド・テスト

```bash
npm run build
npm run test:all    # Vitest + cargo test + wasm browser + E2E
```
