# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/masanori0209/wasabi-table/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/masanori0209/wasabi-table/compare/v0.1.4...v1.0.0
[0.1.4]: https://github.com/masanori0209/wasabi-table/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.3
[0.1.2]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.2
[0.1.1]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.1
[0.1.0]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.0
