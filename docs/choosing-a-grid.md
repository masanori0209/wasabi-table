# Choosing a Grid

[日本語](./choosing-a-grid.ja.md)

Neutral guide to when **Wasabi Table fits or does not**. Follows [positioning](./positioning.md) — no “better than X” claims.

## What Wasabi Table is

A **Canvas + Rust/WASM Excel-like data grid** for list display, cell editing, and large `records`. Not a full spreadsheet.

## Good fit

| Scenario | Why |
|----------|-----|
| SaaS admin master lists | Column schema, validation, keyboard UX |
| Internal editable grids | Start in a few npm lines |
| **100k–1M row** view / light edit | records + viewport sync |
| DOM grids feel too heavy | Canvas batch rendering |
| Avoid framework lock-in | Canvas core; wrap in React etc. |

## Poor fit

| Scenario | Consider instead |
|----------|------------------|
| Formulas (`=SUM`, etc.) | Full spreadsheet products |
| Pivot / chart integration | BI / spreadsheet stacks |
| Required cell merge | Layout-focused table UIs |
| Full control of table markup (headless) | Headless table libraries |
| Node-only server runtime | Wasabi needs **browser + WASM + Canvas** |
| Real-time co-editing | Collab-specific products / custom OT |
| DOM-table-equivalent a11y required | Evaluate Canvas limits ([browser-support.md](./browser-support.md)) |

## Category placement

Choose by **category**, not product names:

```
What you need
    │
    ├─ Formulas, pivot, reporting ───► Full spreadsheet
    │
    ├─ Custom UI, table logic only ───► Headless table
    │
    ├─ Enterprise DOM feature set ───► Large DOM grids
    │
    └─ Large list + Excel-like edit ──► Canvas data grid
                                              │
                                              └─ Wasabi Table
```

## Checklist for Canvas data grids

- [ ] Many rows (or expected to grow)
- [ ] Cell edit, clipboard, undo needed
- [ ] **No** formula engine
- [ ] Modern browsers (ESM + WASM) OK
- [ ] Want reproducible perf → [benchmark.html](../examples/npm-package/benchmark.html)

## About the records API

Wasabi `dataSource.records` follows the common Canvas pattern: **logical full row set, only viewport rows loaded in WASM**.

- **Not compatible** with other products’ records APIs
- Compare each product’s data-binding docs when evaluating similar tools (avoid named feature matrices per [positioning](./positioning.md))

## Phased adoption

| Phase | Needs | Wasabi tier |
|-------|-------|-------------|
| PoC | Display + click edit | Tier 1 |
| App screen | Column types, validation, input bar | Tier 2 |
| Production scale | records, filters, themes | Tier 3 |

See [positioning.md](./positioning.md#user-journey-progressive-disclosure).

## Still unsure?

1. Try Tier 1 in [Getting Started](./getting-started.md) (~30 min)
2. Measure your row counts on [benchmark.html](../examples/npm-package/benchmark.html)
3. If **any** formula/pivot is required, Wasabi is likely not a fit

Questions: [GitHub Issues](https://github.com/masanori0209/wasabi-table/issues).
