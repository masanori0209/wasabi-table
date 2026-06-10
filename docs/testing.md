# Testing Strategy

[日本語](./testing.ja.md)

Test layers, CI, and local commands.

## Principles

| Principle | Detail |
|-----------|--------|
| Right tool per layer | Vitest for pure TS, cargo for Rust, Playwright for UX |
| CI reproducibility | `npm run test:all` on push/PR to `main` |
| User flows in E2E | Prefer E2E for regressions |
| Performance | Benchmark page + smoke E2E; avoid strict timing in CI |

## Layers

```
┌─────────────────────────────────────────┐
│  Playwright E2E (e2e/)                  │  User flows
├─────────────────────────────────────────┤
│  Vitest (src-ts/*.test.ts)              │  Pure TS logic
├─────────────────────────────────────────┤
│  cargo test (src/)                      │  Rust unit
├─────────────────────────────────────────┤
│  wasm-pack test --headless              │  WASM in browser
└─────────────────────────────────────────┘
```

## Vitest

Examples:

- `src-ts/filter-sort.test.ts`
- `src-ts/utils.test.ts`
- `src-ts/records-data-source.test.ts`

```bash
npm run test:unit
npm run test:unit:watch
```

Config: `vitest.config.ts`

## Rust

```bash
cargo test
```

Validation and other testable logic in `src/`.

## WASM browser tests

```bash
npm run test:rust
```

May require Chrome/Firefox locally.

## Playwright E2E

Config: `playwright.config.ts`

- `baseURL`: `http://localhost:8501`
- `webServer`: `npm run build && npm run serve`
- Project: **Chromium** (CI)
- On failure: trace / video / screenshot

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:record
npm run test:e2e:report
```

### Spec files

| File | Focus | Tier |
|------|-------|------|
| `table.spec.ts` | Basics, input bar, clipboard, undo | 1–2 |
| `edit-cycle.spec.ts` | Edit cycle, keyboard | 2 |
| `undo-inline.spec.ts` | Inline undo | 2 |
| `records-data-source.spec.ts` | records + viewport | 3 |
| `records-actions.spec.ts` | records edit, dispose | 3 |
| `benchmark.spec.ts` | Benchmark page smoke | 3 |
| `demo-visual.spec.ts` | Demo smoke | 1 |

Assertions use `data-testid` and APIs, not localized strings.

### Tier coverage goals

| Tier | E2E should cover |
|------|------------------|
| Tier 1 | create → setCellValue → render → select |
| Tier 2 | listeners, validation, filter UI |
| Tier 3 | large records smoke, benchmark loads |

Before 1.0: records + filter/sort E2E ([roadmap.md](./roadmap.md))

## Run all

```bash
npm run test:all
```

Same as CI (`.github/workflows/ci.yml`).

## PR expectations

- Behavior changes → update/add **E2E**
- filter-sort / utils → **Vitest**
- Rust validation → **cargo test**
- Breaking API → docs + CHANGELOG

## Benchmarks

- Page: `examples/npm-package/benchmark.html`
- Smoke: `e2e/benchmark.spec.ts`
- No strict perf gates in CI; repro via benchmark page

## Related

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [Design principles — testing](./design-principles.md#9-test-by-layer)
