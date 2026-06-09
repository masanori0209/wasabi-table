# Repository & npm Publishing Checklist

[日本語](./publishing-checklist.ja.md)

Checklist before making the repository public and publishing to npm.

## Phase 0: Security (required)

- [x] Validation tooltip XSS fix (#2)
- [x] Publish build hardening (#3)
- [x] `.gitignore` hardening (#4)
- [ ] Scan git history for secrets (`gitleaks detect`)
- [ ] Final review with `npm pack --dry-run`

## Phase 1: Package quality

- [x] CHANGELOG.md (#5)
- [x] devDependencies audit (#6)
- [ ] Verify size and contents with `npm publish --dry-run`
- [ ] Confirm npm package name `wasabi-table` availability

## Phase 2: Release infrastructure

- [x] `main` branch protection (required CI `test`)
- [x] GitHub repository set to Public
- [ ] Enable 2FA on npm account
- [x] `NPM_TOKEN` in GitHub Secrets
- [x] Release workflow (`.github/workflows/release.yml`)
- [x] First npm publish via version tags

## Phase 3: After publish

- [x] Demo URL in README and getting-started
- [x] GitHub Pages via Actions workflow
- [ ] Verify npm package page description and keywords
- [ ] CONTRIBUTING.md / issue templates (optional)

## Files included in the npm package

See `package.json` `files` field: `dist/`, `pkg/*.wasm`, `README.md`, `LICENSE`, `CHANGELOG.md`.
