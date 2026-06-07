# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/masanori0209/wasabi-table/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.2
[0.1.1]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.1
[0.1.0]: https://github.com/masanori0209/wasabi-table/releases/tag/v0.1.0
