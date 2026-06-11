# Design Principles

[日本語](./design-principles.ja.md)

Criteria for features, PR reviews, and docs. Use with [positioning](./positioning.md).

## 1. Simple by default, depth opt-in

- **Tier 1** (three lines to render) is always the shortest path
- Advanced features (records, filters, custom themes) open via **explicit APIs**
- `DEFAULT_CONFIG` should “just work”

## 2. Performance-critical paths in Rust

Prefer WASM core for:

- Canvas rendering and visible-range math
- Hit-testing (pixel → cell)
- Bulk `row_store` loads
- Hot-path cell validation

Use TypeScript when sufficient ([architecture.md](./architecture.md)).

## 3. Do not grow DOM per cell

- Cell bodies on Canvas; DOM only for edit overlay, MenuField, scrollbars, tooltips
- No per-cell `<td>` pattern

## 4. Framework-agnostic core

- **Canvas + npm package** as the core
- React/Vue via docs and samples ([integrations.md](./integrations.md))
- Framework-locked APIs out of scope for 1.0

## 5. Excel-like UX, not a spreadsheet product

- Keyboard, selection, clipboard, undo feel **Excel-like**
- No formula engine, pivot, or merge ([out-of-scope](./positioning.md))
- “Formula bar” = cell value editor (clarify in docs if confusing)

## 6. Check scope before adding

For new features:

1. Not on [out-of-scope list](./positioning.md#out-of-scope-for-10-state-explicitly)
2. Tier 1 simplicity preserved (defaults / bundle)
3. Repro steps in E2E or unit tests
4. EN/JA docs updated if user-facing

## 7. Measurable claims

- Performance PRs include **benchmark or repro steps**
- Avoid bare “faster than X” ([positioning competitor rules](./positioning.md#rules-for-competitors-and-comparisons))

## 8. Safety and explicit breakage

- User strings via `textContent`, etc. (XSS)
- Breaking API changes per [api-stability.md](./api-stability.md) + CHANGELOG
- `dispose()` frees WASM, observers, DOM (SPA)

## 9. Test by layer

| Layer | Tool |
|-------|------|
| Pure TS (filter-sort, etc.) | Vitest |
| Rust utilities | `cargo test` |
| WASM in browser | `wasm-pack test` |
| User flows | Playwright E2E |

See [testing.md](./testing.md).

## 10. Bilingual docs

- User docs as `.md` / `.ja.md` pairs
- Do not update only one language

## Anti-patterns

- Competitor comparison tables in README → [positioning](./positioning.md)
- Default load of million-row datasets
- WASM-only extensions with TS direct calls instead of public API
- Deferring all a11y — document keyboard behavior early
