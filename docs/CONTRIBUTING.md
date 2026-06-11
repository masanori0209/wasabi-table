# Contributing

[日本語](./CONTRIBUTING.ja.md)

How to open PRs, run the project locally, and what we expect in reviews.

## Before you start

- Read [design principles](./design-principles.md) and [positioning](./positioning.md)
- Bugs / features: [GitHub Issues](https://github.com/masanori0209/wasabi-table/issues)
- Security: [security.md](./security.md)

## Dev environment

### Prerequisites

- Node.js **18+**
- Rust **1.70+**
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- Playwright: Chromium (`npx playwright install chromium`)

### First-time setup

```bash
git clone https://github.com/masanori0209/wasabi-table.git
cd wasabi-table
npm install
npm run build    # required: pkg/ + dist/
```

### Daily workflow

```bash
npm run dev              # TS watch
npm run build:wasm       # after Rust changes
npm run build            # full WASM + TS
```

After Rust/WASM edits, run at least **`npm run build:wasm`** before E2E or demos.

### Demo

```bash
npm run serve
# http://localhost:8501/examples/npm-package/index.html
```

## Tests

Before PRs when possible:

```bash
npm run test:all
```

Details: [testing.md](./testing.md)

| Area changed | Minimum |
|--------------|---------|
| `src-ts/` logic | `npm run test:unit` |
| `src/` Rust | `cargo test` |
| User flows / UI | `npm run test:e2e` |
| Public API | above + docs |

## PR guidelines

### Scope

- One PR, one purpose (feature / fix / docs)
- Discuss [out-of-scope](./positioning.md#out-of-scope-for-10-state-explicitly) features in Issues first

### Code

- Match existing naming and module layout
- Performance PRs: benchmark or repro in description
- Avoid stray debug `console.log`

### Documentation

Update **EN/JA pairs** for user-facing changes:

- `docs/*.md` / `docs/*.ja.md`
- `README.md` / `README.ja.md` when needed
- API changes: `docs/api-core.*` and `CHANGELOG.md`

### CHANGELOG

Under `## [Unreleased]` in [Keep a Changelog](https://keepachangelog.com/) format:

- `Added` / `Changed` / `Fixed` / `Deprecated` / `Security`

## Commit messages

Short subject in English or Japanese, intent clear:

```
fix: records mode paste undo history
docs: add architecture overview
feat: column resize on header drag
```

## Releases (maintainers)

- npm `package.json` is version source — sync `Cargo.toml` on release
- [publishing-checklist.md](./publishing-checklist.md)
- Tag `v*` triggers release workflow (`.github/workflows/release.yml`)

## License

Contributions are under [MIT](../LICENSE).

## Related

- [Roadmap](./roadmap.md)
- [API stability](./api-stability.md)
