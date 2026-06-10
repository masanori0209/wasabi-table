# Architecture Overview

[日本語](./architecture.ja.md)

Internal layout and the split between Rust/WASM and TypeScript.

## Stack

```
┌─────────────────────────────────────────────────────────┐
│  Application (React / Vue / plain HTML, etc.)           │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  TypeScript wrapper (src-ts/ → dist/)                   │
│  · WasabiTable class, events, undo/redo                 │
│  · Filter/sort, RecordsDataSource, listener API        │
│  · DOM: scrollbars, MenuField, tooltips                │
└───────────────────────────┬─────────────────────────────┘
                            │ wasm-bindgen
┌───────────────────────────▼─────────────────────────────┐
│  Rust core (src/ → pkg/*.wasm)                          │
│  · Canvas 2D render, hit-test, scroll math             │
│  · Cell data, selection, edit, clipboard               │
│  · Column headers, validation, conditional formatting  │
└─────────────────────────────────────────────────────────┘
```

## Why Canvas + WASM

| Approach | Traits | Wasabi choice |
|----------|--------|---------------|
| DOM table | Simple, a11y-friendly | DOM cost grows with rows |
| Virtual DOM grid | Mid-scale | Cell count / GC pressure |
| **Canvas + WASM** | Batch draw, controlled memory | **Large lists + Excel-like UX** |

Hot paths (render, visible range, hit-test) live in Rust; DX (config JSON, events, filters) in TypeScript.

## Rust modules (src/)

| Module | Role |
|--------|------|
| `table.rs` | Core `WasabiTable`: draw, input, selection, clipboard, row_store |
| `types.rs` | `TableConfig`, `ColumnHeader`, `CellRange`, etc. |
| `validation.rs` | Column-type validation |
| `format.rs` | Conditional formatting |
| `render.rs` | Column names and render helpers |
| `edit.rs` | Inline edit overlay (input element) |

## TypeScript modules (src-ts/)

| Module | Role |
|--------|------|
| `index.ts` | Public `WasabiTable`, WASM init, canvas wiring |
| `records-data-source.ts` | Large `records[]` + column defs |
| `filter-sort.ts` | Filter/sort (**TS layer**, unit-testable alone) |
| `undo-stack.ts` | Undo/redo history |
| `listeners.ts` | Cell bar (value editor) + stats |
| `header-dialog.ts` | Header filter/sort UI |
| `utils.ts` | CSV export, cell reference parse, etc. |

### Why filter/sort is in TypeScript

- Easier to combine with app `records` and events
- `filter-sort.ts` can be **tested/reused without Wasabi**
- New operators without WASM rebuild

Filtered row indices are applied in WASM via APIs such as `set_filtered_rows`.

## Data models

### 1. Sparse mode (default)

```
HashMap<"row:col", CellData>  (Rust data)
```

Per-cell storage via `setCellValue` / `set_cell_data`. Good for small/medium grids and random access.

### 2. row_store mode (inside WASM)

```
HashMap<row_index, Vec<String>>
```

Bulk load via `set_row_batch` / `clear_row_store`. Used for records viewport sync.

### 3. RecordsDataSource (TypeScript)

```typescript
dataSource: {
  records: RecordRow[];      // logical full set (e.g. 1M rows)
  columns: RecordColumnDef[];
}
```

- **Does not load all rows into WASM**
- Estimates visible row range from scroll + canvas size, syncs buffered slice into `row_store`

## Records viewport sync

```
records[] (TS)                    row_store (WASM)
     │                                   ▲
     │  estimateViewportRowRange()       │
     │  scrollY + canvas height          │
     └──────── syncRecordsViewport() ────┘
              set_row_batch (500 rows/chunk)
```

`RECORDS_VIEWPORT_BUFFER_ROWS = 40` adds vertical buffer to reduce flicker on fast scroll.

Edits call `syncRecordsRowToWasm(row)` for that row only.

## Render pipeline (summary)

1. `render()` (TS → WASM)
2. Compute `visible_rows` / `visible_cols` from scroll
3. In records mode, `syncRecordsViewport()` first
4. Draw header → grid → cell text → selection overlay
5. Apply conditional format / validation errors

DOM is limited to **edit input**, MenuField select, scrollbars, tooltips. Cell bodies are Canvas.

## Event flow

| Input | Main handler |
|-------|--------------|
| Mouse click / drag | TS canvas listeners → WASM `pixel_to_cell` / range |
| Wheel | WASM `handle_canvas_wheel` |
| Keyboard (arrows, Ctrl+C, etc.) | TS + WASM (TS priority while editing) |
| Inline edit | WASM overlay input; Enter/Tab/Escape |

## Build outputs

| Output | Contents |
|--------|----------|
| `pkg/wasabi_table_bg.wasm` | Rust core |
| `pkg/wasabi_table.js` | wasm-bindgen glue |
| `dist/index.js` | TS wrapper (fixed imports) |
| `dist/index.d.ts` | Public types |

`npm run build` = `wasm-pack` + `tsc` + `fix-imports.js`

## Extension guide

- **Render, hit-test, bulk data**: prefer Rust
- **UI integration, business rules, testability**: prefer TypeScript
- Cross-check [design principles](./design-principles.md) and [out-of-scope](./positioning.md) before adding features
