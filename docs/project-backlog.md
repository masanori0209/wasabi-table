# Project Documentation Backlog

[日本語](./project-backlog.ja.md)

Docs completion status. Implementation work: [roadmap.md](./roadmap.md).

## Done (docs)

| Document | Contents |
|----------|----------|
| [positioning.md](./positioning.md) | Product definition, competitor rules, tiers, out-of-scope |
| [roadmap.md](./roadmap.md) | **Final** — persona / Must UX / Release Train |
| [architecture.md](./architecture.md) | Rust/TS split, data models, viewport sync |
| [api-stability.md](./api-stability.md) | Public API, semver, deprecation |
| [design-principles.md](./design-principles.md) | PR criteria |
| [choosing-a-grid.md](./choosing-a-grid.md) | Fit / misfit, category selection |
| [integrations.md](./integrations.md) | React, dispose, Strict Mode |
| [browser-support.md](./browser-support.md) | Browsers, no Node, a11y |
| [testing.md](./testing.md) | Vitest / cargo / E2E / CI |
| [security.md](./security.md) | Reporting, XSS, dependencies |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Dev setup, PRs, CHANGELOG |
| [getting-started.md](./getting-started.md) | Install, minimal example |
| [api-core.md](./api-core.md) | Public API reference |
| [publishing-checklist.md](./publishing-checklist.md) | npm release steps |
| [CHANGELOG.md](../CHANGELOG.md) | Release history |

Index: [docs/README.md](./README.md)

## Not yet (before 1.0 if needed)

| Document | When |
|----------|------|
| `migration-1.0.md` | v0.9 — only if breaking changes |
| Root `SECURITY.md` | Optional — link to security.md |

## README TODO (outside docs/)

| Item | Notes |
|------|-------|
| Tier 1/2/3 in README intro | [roadmap v0.2.0](./roadmap.md#v020--saas-first-drop) |
| Benchmark summary + link | benchmark.html |
| Link to docs index | [docs/README.md](./README.md) |

## Decisions (confirmed)

[roadmap.md §2](./roadmap.md#2-decisions-as-of-2026-06)

| Topic | Decision |
|-------|----------|
| Primary persona | **SaaS admin UI** |
| v1.0 Must UX | Column resize / freeze / row selection / touch / records filter E2E |
| Target date | Phases only (no calendar date) |
| React package | Docs + sample only at 1.0 |

## Do not commit

Competitor matrices — Notion / local ([positioning](./positioning.md))
