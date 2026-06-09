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

## Row / column / sheet selection

| Method / action | Description |
|-----------------|-------------|
| `selectColumn(col)` | Select an entire column |
| `selectRow(row)` | Select an entire row |
| `selectAll()` | Select the whole sheet |
| Click column header (left area) | Column select |
| Click column header (right `▾` zone) | Filter/sort dialog (requires column headers) |
| Click row header | Row select |
| Click top-left corner | Sheet select |
| `Ctrl/Cmd+A` | Sheet select |

Column headers split into a **selection zone** (left) and a **filter control zone** (28px right edge) so filter UI does not conflict with column selection.

## Clipboard & editing

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+C` | Copy |
| `Ctrl/Cmd+V` | Paste |
| `Ctrl/Cmd+X` | Cut |
| `Ctrl/Cmd+Z` | Undo |
| `Enter` / `F2` | Start editing |
| `Shift+Arrow` | Range selection |

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
