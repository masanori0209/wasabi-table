# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Inline editor and formula bar key handling now ignore navigation and commit keys during IME composition, preventing keyboard navigation from becoming stuck after Japanese conversion (#51)
- Formula bar Enter and arrow keys no longer bubble into the grid and trigger a second navigation or edit action (#51)

### Added
- E2E regression coverage for IME Enter/Tab/Escape, keyCode 229 fallback, formula bar composition, and normal edit navigation (#51)

## [1.1.1] - 2026-06-25

### Added
- `contextMenu.builtInActionLabels` for renaming built-in context menu actions without replacing their behavior (#49)
- E2E coverage for renamed built-in actions preserving their original behavior (#49)

### Changed
- README and README.ja document built-in context menu label customization (#49)

## [1.1.0] - 2026-06-24

### Added
- Cell right-click context menu with built-in copy, cut, paste values, paste transposed, and paste skip empty actions (#46)
- Context menu extension API via `contextMenu.actions`, configurable `builtInActions`, and `setContextMenuOptions()` (#46)
- Public clipboard helpers for library integrations: `copySelectionToClipboard()`, `cutSelectionToClipboard()`, and `pasteClipboardToSelection()` (#46)
- E2E coverage for context menu open/close, copy, cut with undo, paste special, and custom actions (#46)

### Changed
- `pasteFromClipboard()` now accepts paste-special options for transpose and skip-empty behavior (#46)
- README and README.ja document the context menu API (#46)

## [1.0.9] - 2026-06-20

### Fixed
- Scheduled render, scroll, scrollbar, and validation tooltip callbacks are cancelled or guarded during `dispose()` so they cannot touch freed table state (#37)
- MenuField document listeners now use stable references and are removed on close/dispose to avoid keydown listener accumulation (#37)
- MenuField selection now reports the correct previous value in `onCellChange(oldValue, newValue)` (#37)

### Added
- E2E regression coverage for lifecycle disposal after scroll and MenuField listener/change-event behavior (#37)

## [1.0.8] - 2026-06-20

### Fixed
- MenuField select boxes now close on grid scroll so option lists cannot remain detached from their source cell (#34)
- Validation tooltips are hidden during scroll and no longer reappear for off-screen selected cells (#34)

### Added
- E2E coverage for floating cell UI during scroll, including MenuField, inline edit, and validation tooltip behavior (#34)

## [1.0.7] - 2026-06-19

### Fixed
- Zero-result filters no longer allow selection, hit-testing, copy, or paste operations to fall back to hidden row 0 (#31)
- `clearAllFilters()` now preserves active sort state while rebuilding display-order rows (#31)

### Added
- E2E regression coverage for filtered range paste and undo/redo in records mode and standard table mode (#31)
- E2E regression coverage for zero-result filters and sort state after clearing filters (#31)

## [1.0.6] - 2026-06-19

### Fixed
- Filtered and sorted range operations now only copy, clear, and paste into visible rows in records mode and standard table mode (#28)

### Added
- E2E regression coverage for filtered range copy/delete in records mode and standard table mode

## [1.0.5] - 2026-06-13

### Removed
- Public exports `generatePersonRecords` and `CHEETAH_STYLE_COLUMNS` (benchmark sample data lives under `examples/npm-package/` only)

### Changed
- Remove third-party product names from published code comments and docs positioning notes

## [1.0.4] - 2026-06-13

### Changed
- WASM build target switched from `web` to `bundler` (removes runtime `fetch` in wasm-bindgen glue; use a bundler such as Vite/webpack for `.wasm` imports)
- WASM initialization uses side-effect import + `ensureWasmInitialized()`; advanced hosts can call `initWasmFromExports()`
- Demo/E2E serving uses Vite instead of plain `http.server` (required for bundler-target WASM)
- GitHub Pages deploy builds a Vite static site (`npm run build:site`)
- Updated `wasm-bindgen`, `js-sys`, `web-sys`, and `wasm-bindgen-test`

## [1.0.3] - 2026-06-11

### Added
- Excel-compatible paste: single copied cell fills entire multi-cell selection; block paste anchors at active cell
- Autofill (fill handle): drag to extend series, double-click to fill down to adjacent column data
- Series detection for numbers, text-with-number suffix, and literal repeat
- Public APIs: `applyAutofill()`, `applyAutofillDoubleClickDown()`
- Unit/E2E tests for paste and autofill

## [1.0.2] - 2026-06-11

### Fixed
- Demo re-init: `dispose()` old `WasabiTable` before `initTable()` to prevent duplicate canvas listeners (ghost grid / sample data visually wiped on margin click)
- `WasabiTable.dispose()` now tears down canvas/document event listeners via `AbortController`
- Render: fill viewport margins beyond table bounds with background color (no stray grid in dead zone)
- Horizontal scroll max no longer adds extra 50px past last column

### Added
- E2E: sample reload listener leak and margin-click regression (`e2e/sample-data-bounds.spec.ts`)

## [1.0.1] - 2026-06-11

### Added
- `selectColumn()`, `selectRow()`, `selectAll()` public APIs
- Column header split: body click selects column, `▾` zone opens filter/sort dialog
- Top-left corner click selects entire sheet; filter affordance on configured column headers
- E2E: header row/column/all selection (`e2e/header-selection.spec.ts`)

### Changed
- Row header click uses WASM `select_entire_row` (Shift to extend) alongside programmatic `selectRow()`
- `Ctrl/Cmd+A` refreshes formula bar reference via `selectAll()`

## [1.0.0] - 2026-06-10

### Added
- Column resize via header edge drag; `setColumnWidth` / `getColumnWidth` public API
- Row selection via row header click (Shift to extend)
- `freeze_cols` config — freeze first N data columns on horizontal scroll
- Basic touch support (touch → mouse forwarding)
- `clearAllCellData`, `resetScroll` public API
- Excel-compatible clipboard TSV (`\r\n` copy, CRLF normalize, empty-row preserve)
- Product & direction docs (roadmap, positioning, architecture, api-stability, migration-1.0, JA/EN)
- E2E: column resize, records filter/sort, freeze, row selection, touch, clipboard round-trip

### Changed
- README: Tier 1/2/3 journey, benchmark summary, bundle size note, out-of-scope section
- Public API documented in api-core (resize, freeze, row select, CSV export)
- `Cargo.toml` / npm version synced at 1.0.0

### Fixed
- Demo sample data load: clear prior cells, sync column count to headers, remove async race
- Prune cell data outside `row_count` / `col_count` on config and header changes

## [0.1.4] - 2026-06-09

### Added
- Records reference mode (`dataSource.records`) with viewport-only WASM sync for million-row arrays
- `RecordsDataSource`, `generatePersonRecords`, and `CHEETAH_STYLE_COLUMNS` exports
- Live performance benchmark page (`examples/npm-package/benchmark.html`) with EN/JA UI
- Records action E2E coverage and benchmark smoke tests

### Changed
- Documentation and demo copy: replace ambiguous「統合版」wording with concrete API names

### Fixed
- Sparse-mode paste now records undo history so Ctrl+Z restores pre-paste cells
- Records-mode editing, selection, cut/paste, and `dispose()` DOM cleanup
- Benchmark init loop disposes tables between size trials

## [0.1.3] - 2026-06-07

### Added
- Bilingual documentation (English / Japanese) for README, docs, and usage examples
- Demo page i18n with EN/JA language switcher and `?lang=en` / `?lang=ja` URL support

### Changed
- E2E tests use `data-testid` and `getStats()` instead of localized UI strings

## [0.1.2] - 2026-06-07

### Fixed
- Cell click and drag selection no longer double-fire or clear selection on single click
- Formula bar and cell reference stay in sync after canvas interactions
- Edit cycle keyboard bugs: focus no longer stolen during inline editing
- Arrow keys while editing now commit the value and move to the adjacent cell (Excel-like)
- Stale inline edit overlays are removed when starting a new edit
- Formula bar arrow/Enter navigation stays in sync with the table

## [0.1.1] - 2026-06-07

### Added
- First npm publish via GitHub Actions

## [0.1.0] - 2026-06-07

### Added
- Undo/redo with toast notifications
- Rectangular range selection (Shift+Arrow, mouse drag)
- Rectangular copy, cut, and paste
- Playwright E2E tests (21 scenarios)
- Vitest unit tests
- CI workflow (build + unit + Rust + E2E)
- Filter/sort and header dialog modules
- Dark theme support in demo
- Initial public-ready package structure
- Rust + WASM core with TypeScript wrapper
- Canvas-based Excel-like table rendering
- MIT License

### Security
- Validation tooltip XSS fix (`textContent` instead of `innerHTML`)
- Publish build hardening (wasm-opt, debug log stripping, no source maps)
- `.gitignore` hardening for secrets

### Changed
- Selection overlay fill visibility improved
- Redo toast uses distinct gold styling

[Unreleased]: https://github.com/masanori0209/wasabi-table/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/masanori0209/wasabi-table/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/masanori0209/wasabi-table/compare/v1.0.11...v1.1.0
[1.0.9]: https://github.com/masanori0209/wasabi-table/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/masanori0209/wasabi-table/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/masanori0209/wasabi-table/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/masanori0209/wasabi-table/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/masanori0209/wasabi-table/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/masanori0209/wasabi-table/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/masanori0209/wasabi-table/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/masanori0209/wasabi-table/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/masanori0209/wasabi-table/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/masanori0209/wasabi-table/compare/v0.1.4...v1.0.0
[0.1.4]: https://github.com/masanori0209/wasabi-table/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.3
[0.1.2]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.2
[0.1.1]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.1
[0.1.0]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.0
