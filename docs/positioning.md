# Positioning and External Communication

[日本語](./positioning.ja.md)

Product definition, differentiation messaging, and rules for mentioning competitors. Use this when writing README copy, demos, release notes, or social posts.

## Product definition (one sentence)

**A high-performance, Excel-like data grid on Canvas + Rust/WASM. Start with a few npm lines; deepen into column schemas, large-scale records, filters, and themes when needed.**

## Category placement

| Category | Description | Wasabi's relation |
|----------|-------------|-------------------|
| DOM / virtual-scroll grids | Rich UI, many features, enterprise | **Different use case** (DOM cost, bundle size) |
| Headless tables | App builds all UI | **Excel-like UX built in** |
| Canvas data grids | Large lists, fast scroll | **Primary focus** |
| Full spreadsheets | Formulas, pivot, charts | **Out of scope** (by design) |

## Differentiation axes (no name-dropping)

1. **Predictable performance** — Canvas rendering without per-cell DOM; render, hit-test, and viewport math in Rust/WASM.
2. **Large data** — `dataSource.records` with viewport sync separates logical row count from memory.
3. **Progressive API** — Tier 1 (3 lines) → Tier 2 (columns, listeners) → Tier 3 (records, filters, themes, advanced APIs).
4. **Data integrity** — Column types and validation live in the WASM core; apps pass column definitions.
5. **Transparent benchmarks** — Publish reproducible numbers on our benchmark page.

## User journey (Progressive Disclosure)

### Tier 1 — 30 seconds

```typescript
const table = await WasabiTable.create(canvas);
table.setCellValue(0, 0, 'Hello');
table.render();
```

**Message**: Light, fast, Excel-like interaction with no extra UI code.

### Tier 2 — App integration

- `createWasabiTableWithListeners` (cell reference, input bar, stats)
- `setColumnHeaders` + field types (validation)
- `applyTheme` / event handlers

**Message**: Enough for typical list/edit screens.

### Tier 3 — Scale and customization

- `dataSource.records` (viewport sync)
- Filter/sort, conditional formatting, custom themes
- Reuse `filter-sort.ts`, wire `RecordsDataSource`

**Message**: Large master data and log views; opt-in depth.

## Out of scope for 1.0 (state explicitly)

Also document what we **do not** build:

- Formula engine (`=SUM`, etc.) — the formula bar is a **cell value editor**, not a spreadsheet engine
- Pivot, charts, chart integration
- Cell merge
- Framework-locked core (React-only, etc.)
- Server-side rendering (WASM + Canvas is browser-only)
- Real-time collaborative editing

## Rules for competitors and comparisons

### Principles

| Rule | Why |
|------|-----|
| **No competitor comparison tables** in README and other public-facing copy | Avoid stale claims, bias debates, and wrong expectations |
| Position via **category comparison** (DOM / Headless / Canvas / Spreadsheet) | Differentiation without friction |
| Show performance via **our benchmarks + reproduction steps** | Safer and more credible than "faster than X" |
| Avoid "X alternative" or "X killer" | Invites feature-scope mismatch and backlash |
| Do not use competitor logos or UI screenshots without permission | Trademark / copyright risk |

### Acceptable phrasing

- "A Canvas-based data grid focused on large-scale records display and editing"
- "Benchmark results under fixed conditions are published on our [benchmark page](../examples/npm-package/benchmark.html)"
- "If you need a formula engine or pivot, a full spreadsheet product is a better fit"

### Limited name-dropping (optional, docs only)

In selection guides only (e.g. future `docs/choosing-a-grid.md`), neutral positioning is OK:

- Good: "Similar in spirit to CheetahGrid's records API (not compatible)"
- Bad: "Faster and lighter than CheetahGrid"

Answers in Issues/Discussions may be factual; do not promote them to README.

### Benchmarks

- Publish **Wasabi Table measurements** with environment and steps
- Same data shape (e.g. `CHEETAH_STYLE_COLUMNS`) is fine; do not put third-party product names in result tables
- Always link reproducible URL (`benchmark.html`)

## Internal only (do not commit)

Feature matrices, win/loss notes, pricing comparisons — keep in Notion or local notes, not in the repo.

## Pre-publish checklist

- [ ] No competitor comparison table
- [ ] No "alternative", "killer", or "beats" claims without proof
- [ ] Performance claims link to reproducible benchmark conditions
- [ ] Copy does not imply spreadsheet formulas
- [ ] Tier 1 simplicity is clear upfront
