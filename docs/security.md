# Security

[日本語](./security.ja.md)

Reporting vulnerabilities, development practices, and dependencies.

## Reporting

Report security issues via **GitHub Issues**:

- https://github.com/masanori0209/wasabi-table/issues
- Include repro steps, impact, and environment
- Prefix title with `[security]` for sensitive issues if needed

(A root `SECURITY.md` may link here later.)

## Known mitigations (see CHANGELOG)

| Item | Mitigation |
|------|------------|
| Validation tooltip XSS | User strings via `textContent`, not `innerHTML` (v0.1.0) |
| Release build | wasm-opt, debug log stripping, no source maps in publish |
| Secrets | `.env` gitignored; template [`.env.example`](../.env.example) |

## Development practices

### User input

- Treat strings in DOM as **plain text** (`textContent`, `createTextNode`)
- Same for validation error messages
- If HTML cells are added later, document sanitization here

### WASM / supply chain

- Commit `Cargo.lock` and `package-lock.json`
- CI uses `npm ci`

### Dependency updates

- Run `npm audit` / consider `cargo audit`
- devDependency CVE fixes tracked in [CHANGELOG](../CHANGELOG.md)
- Run `npm run test:all` on security patch PRs

### Published package

`npm pack` mainly includes:

- `dist/`, `pkg/*.wasm`, README, LICENSE, CHANGELOG

Not published: `examples/`, `e2e/`, sources. See [publishing-checklist.md](./publishing-checklist.md).

## Secrets policy

- Never commit API keys, tokens, or `.env`
- npm tokens only in GitHub Secrets
- Public repo exposes commit emails — check GitHub privacy settings

Recommended: `gitleaks detect` before going public ([publishing-checklist](./publishing-checklist.md) Phase 0)

## Browser notes

- Clipboard depends on permissions and HTTPS
- WASM runs sandboxed — **no arbitrary code execution API**
- Load WASM only from trusted `pkg/` on same origin or via bundler

## Pre-1.0 checklist

- [ ] Re-audit tooltip, MenuField, other DOM injection
- [ ] No critical `npm audit` issues (or documented exceptions)
- [ ] gitleaks / secret scan (recommended)
- [ ] Report path linked from README

## Related

- [Design principles — safety](./design-principles.md#8-safety-and-explicit-breakage)
- [Publishing checklist](./publishing-checklist.md)
