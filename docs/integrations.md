# Framework Integration

[日本語](./integrations.ja.md)

Wasabi Table is **framework-agnostic**. This doc covers SPA lifecycle and React patterns.

## Common pattern

```typescript
import { WasabiTable } from 'wasabi-table';

// 1. Place canvas in DOM (tabindex="0" recommended)
// 2. create on mount
// 3. dispose on unmount
```

### Canvas notes

- `tabindex="0"` for keyboard focus
- Internal `ResizeObserver` tracks parent size changes after `create`
- Canvas sizing accounts for `devicePixelRatio`

## Lifecycle: `dispose()`

Always call **`dispose()` on unmount** in SPAs.

`dispose()`:

- Disconnects `ResizeObserver`
- Removes validation tooltip DOM
- Removes MenuField select
- Tears down custom scrollbars
- Calls WASM `free()`

```typescript
const table = await WasabiTable.create(canvas, config);
// ...
table.dispose();
```

E2E records tests call `dispose()` after each case (`e2e/records-*.spec.ts`).

### React Strict Mode (dev)

React 18 Strict Mode **double-invokes** effects.

```tsx
useEffect(() => {
  let table: WasabiTable | null = null;
  let cancelled = false;

  (async () => {
    if (!canvasRef.current) return;
    const t = await WasabiTable.create(canvasRef.current, config);
    if (cancelled) {
      t.dispose();
      return;
    }
    table = t;
    setTable(t);
  })();

  return () => {
    cancelled = true;
    table?.dispose();
  };
}, [config]);
```

Use `cancelled` to dispose late-completing `create` calls.

## React

No `@wasabi-table/react` at 1.0 ([roadmap.md](./roadmap.md)). Sample:

- [`examples/npm-package/react-example.tsx`](../examples/npm-package/react-example.tsx)

### Hook checklist

1. `useRef<HTMLCanvasElement>` for canvas
2. `useEffect`: `create` / cleanup `dispose`
3. Mirror selection via `setEventHandlers`
4. Use `createWasabiTableWithListeners` inside effect for input bar wiring

### Re-renders

- Grid draws on Canvas; React re-renders need not call `table.render()` every time
- On data updates: `setCellValue` / `setBatchData` / `setRecords` + `render()` when needed

## Vue / Svelte / others

Same pattern:

- mount → `WasabiTable.create`
- unmount → `dispose`
- On option changes: recreate table or use public partial-update APIs

Community examples may be linked here later.

## Listener API (Tier 2)

Wire cell reference, input bar, stats:

```typescript
import { createWasabiTableWithListeners } from 'wasabi-table';

const { table, listeners } = await createWasabiTableWithListeners(
  canvas,
  { row_count: 50, col_count: 10 },
  {
    cellReferenceSelector: '#cellRef',
    formulaInputSelector: '#formulaInput',
    statsElementSelector: '#stats',
  }
);
```

In React, render those elements in JSX and pass selectors by `id` or `data-testid`.

## Records mode (Tier 3)

```typescript
await WasabiTable.create(canvas, {
  dataSource: {
    records: largeArray,
    columns: [{ field: 'name', header: 'Name', width: 120 }],
  },
});
```

- After in-place array edits: `table.refresh()`
- Replace array: `table.setRecords(newRecords)`

See [architecture.md](./architecture.md#records-viewport-sync).

## Common pitfalls

| Issue | Fix |
|-------|-----|
| Keyboard ignored | `tabindex="0"`; focus canvas on click |
| Double WASM in Strict Mode | `cancelled` + `dispose` (above) |
| Memory leak | `dispose()` on unmount |
| Import path | Published: `from 'wasabi-table'`; clone: build then `dist/` |
| SSR | **Not supported** — client-only dynamic import |

## Related

- [Getting Started](./getting-started.md)
- [Usage examples](../examples/usage-examples.md)
- [Browser support](./browser-support.md)
