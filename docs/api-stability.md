# API Stability Policy

[日本語](./api-stability.ja.md)

Definition of the **public API** and how we handle semver and breaking changes. v1.0.0 is the stability release under this policy.

## Version source of truth

| Target | Source |
|--------|--------|
| User-facing semver | **`package.json` (npm)** |
| Rust crate | **Synced on release** with npm (current 0.1.0 drift to be fixed) |

## Public API (stable)

Anything importable from the npm entry `wasabi-table`. Types: `dist/index.d.ts` is canonical.

### Classes and functions

- `WasabiTable` (all public methods including `create`)
- `createWasabiTableWithListeners`
- `WasabiTableListeners`
- `RecordsDataSource`
- `HeaderDialogController` (when exported)

### Types, constants, utilities

- Types/constants/functions **re-exported** from `dist/index.d.ts` / `dist/index.js`
  - e.g. `TableConfig`, `ColumnHeader`, `EventHandlers`, `FieldType`, `DEFAULT_CONFIG`
  - e.g. `applyFilterSort`, `exportTableToCSV`, `parseCellReference`

### Guarantees

- Same major: preserve **signatures and semantics** of public API
- Bug fixes: patch
- Backward-compatible additions: minor (after 1.0)

## Non-public / advanced API (not stable)

**Breaking changes allowed** without prior notice.

| Target | Notes |
|--------|-------|
| Direct WASM calls | snake_case methods such as `set_cell_data`, `handle_canvas_keydown` |
| `pkg/` internals | wasm-bindgen generated details |
| Internal TS types | e.g. `ExtendedWasmWasabiTable` |
| Non-exported modules | Anything not exported from `src-ts/index.ts` |

WASM APIs are documented under “Rust / WASM direct API (reference)” in [api-core.md](./api-core.md). **Reference only** — not semver-bound.

## 0.x vs 1.0+

| Period | Breaking changes |
|--------|------------------|
| **0.x** | Allowed; document in CHANGELOG `### Changed` + migration notes |
| **0.9.x** | **Last cleanup window** before 1.0 |
| **1.0+** | Strict [SemVer](https://semver.org/); breaking changes only on **major** |

## Deprecation

1. Mark `@deprecated` in JSDoc + document replacement in minor release
2. Remove after at least **one minor** (or next major)
3. CHANGELOG `Deprecated` section

Shorter deprecation in 0.x is OK; 0.9 → 1.0 must announce removals in CHANGELOG.

## Breaking change examples

- Remove/rename public methods
- Narrower parameter/return types
- Default behavior changes (especially Excel-like UX)
- Remove exports

## Non-breaking examples

- New methods/options (existing calls unchanged)
- New `FieldType` values
- Bug fixes restoring intended behavior
- Internal Rust optimizations with unchanged public behavior

## Pre-1.0 checklist

- [ ] `dist/index.d.ts` matches [api-core](./api-core.md)
- [ ] WASM-only APIs labeled reference / unstable
- [ ] CHANGELOG states 0.x → 1.0 breaking changes (if any)
- [ ] npm / Cargo versions aligned

## Migration support

- 0.x → 1.0: CHANGELOG + optional `docs/migration-1.0.md` (at 0.9)
- Update [usage examples](../examples/usage-examples.md) when breaking changes ship
