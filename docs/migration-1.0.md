# Migrating from 0.x to 1.0.0

[日本語](./migration-1.0.ja.md)

**1.0.0** is the stable public API release for Wasabi Table.

## Breaking changes

**None from 0.9.x to 1.0.0.** The major bump declares API stability, not a breaking redesign.

Additions during 0.x:

| API | Since |
|-----|-------|
| `setColumnWidth` / `getColumnWidth` | 0.2.0 |
| `freeze_cols` / `freeze_rows` (`TableConfig`) | 0.3.0 |
| Row selection via row header click | 0.3.0 (behavior only) |

## Upgrade steps

1. `npm install wasabi-table@1.0.0`
2. `npm run build` if using from source
3. Verify: column resize, records + filter (`isActive: true`), `dispose()` in SPAs
4. See [browser-support](./browser-support.md) — still browser-only

## Direct WASM API

snake_case WASM methods remain **unstable** — [api-stability](./api-stability.md)

## Issues

https://github.com/masanori0209/wasabi-table/issues
