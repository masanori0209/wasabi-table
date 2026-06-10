# Roadmap (through v1.0.0)

[日本語](./roadmap.ja.md)

Plan to reach **v1.0.0 (stable public API)**.

- [Positioning](./positioning.md) · [Architecture](./architecture.md) · [API stability](./api-stability.md)

**Schedule**: No calendar dates — progress by **phases and exit criteria**.

---

## 1. North Star

> **Canvas + Rust/WASM Excel-like data grid in a few npm lines.  
> Fits SaaS admin master list/edit screens; scales to large `records` on the same API.**

1.0.0 = **stable API promise**, not every possible feature.

---

## 2. Decisions (as of 2026-06)

| ID | Decision |
|----|----------|
| **P-01** | **Primary persona = SaaS admin UI** (master lists, cell edit, column schema) |
| **P-02** | v1.0 Must UX = **column resize / freeze / row selection / basic touch / records filter·sort E2E** |
| **P-03** | No competitor comparison tables in README |
| **P-04** | Formulas & pivot out of scope for 1.0 |
| **P-05** | No `@wasabi-table/react` at 1.0 — docs + sample only |
| **P-06** | npm version is source of truth; sync `Cargo.toml` on release |
| **P-07** | No target date — **exit criteria per release** |

---

## 3. Baseline (v1.0.0 implemented, unreleased)

### From v0.1.4 ✅

Core Canvas/WASM, columns/validation, sparse + records + viewport, filter/sort (sparse), themes, listeners, tests, CI, bilingual docs, benchmark page.

### Added in v0.2.0 – v1.0.0 ✅

Column resize, `freeze_cols`, row selection, basic touch, records filter E2E, README Tier + bench summary, Cargo/npm sync at 1.0.0, API audit + migration doc.

---

## 4. MoSCoW for v1.0

### Must

**Quality / API**: M-A1–A6 (API audit, Tier docs, CI green, 1M bench, out-of-scope, version sync)

**UX (P-02)**

| ID | Item | Target release |
|----|------|----------------|
| M-U1 | Column resize | **v0.2.0** |
| M-U2 | records filter/sort E2E | **v0.2.0** |
| M-U3 | Freeze rows/columns | **v0.3.0** |
| M-U4 | Row selection | **v0.3.0** |
| M-U5 | Basic touch | **v0.3.0** |

**Outreach**: M-D1 README Tier journey, M-D2 bench summary → v0.2.0

### Should

Bundle size in README, Safari/Firefox notes, CSV export docs

### Could / Won't

See [positioning.md](./positioning.md)

---

## 5. Release train

```
v0.1.4 → v0.2.0 → v0.2.x → v0.3.0 → v0.9.0 → v1.0.0
         SaaS v1      polish    UX Must      API freeze   stable
```

### v0.2.0 — SaaS first drop

Column resize, records filter E2E, README Tier + bench summary, Cargo sync.

**Exit**: M-U1, M-U2, M-D1, M-D2 done; demo shows resize + records filter. ✅

### v0.3.0 — UX Must complete

Freeze, row selection, basic touch + E2E + browser-support update.

**Exit**: M-U3–U5 done and reproducible. ✅

### v0.9.0 — API freeze

Public API audit, optional single breaking batch, migration doc, security pass, Tier E2E suite.

**Exit**: `dist/index.d.ts` matches api-core; CHANGELOG covers 0.x → 1.0. ✅

### v1.0.0 — Stable

All §6 Must checkboxes ✅, GitHub Release + npm 1.0.0.

---

## 6. v1.0.0 checklist

- [x] M-U1–U5, M-A1–A6, M-D1–D2
- [x] S1 bundle size note in README; S3 CSV in api-core
- [ ] S2 Safari/Firefox formal matrix (deferred — manual check recommended in browser-support)

---

## 7. Tier × SaaS admin at 1.0

| Tier | Use | Promise |
|------|-----|---------|
| 1 | Small settings table | 3-line create, edit, undo, keyboard |
| 2 | Master CRUD | Column types, validation, filter/sort, themes, input bar |
| 3 | Large user/order lists | records, resize, freeze, row select, benchmark |

---

## 8. Implementation order

Column resize (0.2) → records filter E2E (0.2) → freeze (0.3) → row selection (0.3) → touch (0.3) → API audit (0.9) → 1.0.0

---

## 9. Versioning

npm `package.json` canonical; sync Cargo on release; CHANGELOG every release.

---

## 10. PR split (before release)

| PR | Scope | Tag |
|----|-------|-----|
| 1 | Docs only | — |
| 2 | v0.2.0: resize, records E2E, README Tier/bench | `v0.2.0` |
| 3 | v0.3.0: freeze, row select, touch, E2E | `v0.3.0` |
| 4 | v0.9.0 + v1.0.0: API audit, migration, CHANGELOG, version 1.0.0 | `v1.0.0` |

Run `npm run test:all` before each merge.
