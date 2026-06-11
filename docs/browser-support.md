# Browser Support

[日本語](./browser-support.ja.md)

Runtime requirements and limitations.

## Policy

| Environment | Support |
|-------------|---------|
| **Modern desktop browsers** | Target (see table) |
| **Node.js only** | **Not supported** |
| **SSR** | **Not supported** |
| **Mobile** | Best effort (1.0: basic tap selection and scroll — [roadmap.md](./roadmap.md)) |

## Target browsers

Assumes **current versions** with ES Modules + WebAssembly + Canvas 2D.

| Browser | Notes |
|---------|-------|
| Chrome / Edge (Chromium) | Primary CI E2E |
| Firefox | Manual verification recommended |
| Safari (macOS / iOS) | WASM + Canvas; manual verification recommended |

Minimum versions to be pinned before 1.0. Until then, treat **“latest”** as in README.

## Required Web APIs

- `HTMLCanvasElement` + `CanvasRenderingContext2d`
- WebAssembly
- ES Modules
- Clipboard API (copy/paste; permissions vary)
- `ResizeObserver`

## Why not Node.js

- Core requires **WASM + Canvas**
- Depends on `document`, canvas, browser events
- Server-side data logic may reuse TS modules like `filter-sort.ts` without the grid UI

## High DPI (Retina)

- Internal canvas buffer respects `devicePixelRatio`
- Demo/benchmark `setupCanvas` scales by DPR

## Clipboard

- E2E grants `clipboard-read` / `clipboard-write` (Playwright)
- Prefer **HTTPS** or localhost in production
- Some browsers require user gesture for paste

## Accessibility (current vs goals)

| Area | Current |
|------|---------|
| Keyboard | Arrows, Enter/F2 edit, Ctrl+C/V/X, Shift+arrow range |
| Screen readers | **Limited** automatic exposure of canvas cell content |
| Focus | Recommend `tabindex` on canvas |

1.0 goal: document keyboard behavior; improve aria where feasible ([roadmap.md](./roadmap.md) Phase B).

If DOM-table-level a11y is mandatory, see [choosing-a-grid.md](./choosing-a-grid.md).

## Mobile / touch

- **1.0**: Touch events forwarded as mouse — tap selection and scroll (E2E: `e2e/touch.spec.ts`)
- Gaps: touch-specific gestures, virtual keyboard vs inline edit optimization

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `import` fails | Served over HTTP(S), not `file://` |
| WASM load error | `npm run build` produced `pkg/` |
| Blank grid | Zero-size canvas or mount while `display:none` |
| Blurry | DPR scaling (see integrations) |
| Paste blocked | HTTPS, user gesture, browser permissions |

## Related

- [Getting Started](./getting-started.md)
- [Integrations](./integrations.md)
