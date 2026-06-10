# Wasabi Table — Core API

[日本語](./api-core.ja.md)

Reference for the Rust/WASM core and TypeScript wrapper.

## Initialization

```typescript
import { WasabiTable, createWasabiTableWithListeners } from 'wasabi-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

const table = await WasabiTable.create(canvas, { row_count: 50, col_count: 10 });

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

## Cell operations

| Method | Description |
|--------|-------------|
| `setCellValue(row, col, value)` | Set cell value |
| `getCellValue(row, col)` | Get cell value |
| `setCellValueWithValidation(row, col, value)` | Set with validation |
| `selectCell(row, col)` | Select a cell |
| `getSelectedCell()` | Current selection `{ row, col }` |
| `getSelectionInfo()` | Single/range selection details |
| `render()` | Redraw canvas |
| `undo()` / `redo()` | History (TypeScript layer) |

## Column headers & validation

```typescript
table.setColumnHeaders(JSON.stringify([
  {
    name: 'email',
    display_name: 'Email',
    width: 180,
    required: true,
    field_type: 'EmailField',
    max_length: 100,
    order: 0,
    is_visible: true,
  },
]));
```

| Method | Description |
|--------|-------------|
| `setColumnHeaders(json)` | Apply column definitions |
| `getColumnHeaders()` | Get column JSON |
| `setColumnWidth(col, width)` | Set column width (px) |
| `getColumnWidth(col)` | Get column width (px) |
| `validateCellValue(col, value)` | Validate input |
| `getSelectedCellValidationError()` | Validation error for selection |

Field types include `CharField`, `EmailField`, `IntegerField`, `DecimalField`, `DateField`, `TimeField`, `BooleanField`, `MenuField`, and more.

## Filter & sort (TypeScript)

| Method | Description |
|--------|-------------|
| `addFilterCondition(condition)` | Add filter |
| `removeFilterCondition(columnIndex)` | Remove column filter |
| `clearAllFilters()` | Clear all filters |
| `setSortCondition(condition \| null)` | Set sort |
| `getFilterState()` | Current filter/sort state |
| `getFilterResult()` | Filtered row count, etc. |

Logic lives in `filter-sort.ts` (unit-tested, reusable).

## Clipboard & editing

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+C` | Copy |
| `Ctrl/Cmd+V` | Paste |
| `Ctrl/Cmd+X` | Cut |
| `Ctrl/Cmd+Z` | Undo |
| `Enter` / `F2` | Start editing |
| `Shift+Arrow` | Range selection |
| Row header click | Select entire row (Shift to extend) |
| Column header edge drag | Resize column |

Copy/paste uses Excel-style TSV (`\r\n` line endings). Empty rows are preserved; CRLF from Excel is normalized on paste. Cell values containing tabs or newlines are not escaped (see limitations in [api-stability](./api-stability.md)).

## Frozen columns

`TableConfig.freeze_cols` — number of data columns to pin on horizontal scroll (`0` = none). Row numbers and the column header row are always pinned.

```typescript
await WasabiTable.create(canvas, { row_count: 100, col_count: 20, freeze_cols: 1 });
```

## CSV export

```typescript
import { exportTableToCSV } from 'wasabi-table';

exportTableToCSV(table, 'export.csv');
```

Exports visible sparse cells (not full `records` arrays). For large datasets, export from your data layer.

## Themes

```typescript
table.applyTheme('dark');
table.applyTheme(WasabiTable.createCustomTheme('light', { background_color: '#f8f9fa' }));
```

## Build & test

```bash
npm run build
npm run test:all
```
