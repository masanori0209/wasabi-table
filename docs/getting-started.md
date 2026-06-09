# Getting Started

[日本語](./getting-started.ja.md)

## Install from npm

```bash
npm install wasabi-table
```

```typescript
import { WasabiTable } from 'wasabi-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const table = await WasabiTable.create(canvas);
```

**Live demo**: https://masanori0209.github.io/wasabi-table/examples/npm-package/index.html  
(Add `?lang=en` or `?lang=ja` to switch UI language.)

## Build from the repository

```bash
npm install
npm run build
```

This generates `pkg/` (WASM) and `dist/` (TypeScript). Run `npm run build` after cloning.

## Minimal HTML example

```html
<canvas id="table" width="800" height="600" tabindex="0"></canvas>
<script type="module">
  import { WasabiTable } from './dist/index.js';

  const canvas = document.getElementById('table');
  const table = await WasabiTable.create(canvas, {
    row_count: 20,
    col_count: 10,
  });

  table.setCellValue(0, 0, 'Hello');
  table.render();
</script>
```

## Listener API (formula bar)

```html
<span id="cellRef">A1</span>
<input id="formula" />
<canvas id="table" width="800" height="600" tabindex="0"></canvas>
<script type="module">
  import { createWasabiTableWithListeners } from './dist/index.js';

  const { table } = await createWasabiTableWithListeners(
    document.getElementById('table'),
    { row_count: 30, col_count: 8 },
    {
      cellReferenceSelector: '#cellRef',
      formulaInputSelector: '#formula',
    }
  );
</script>
```

## Local server

ES module imports require an HTTP server:

```bash
npm run serve
# http://localhost:8501/examples/npm-package/index.html
```

## Tests

```bash
npm run test:unit    # Vitest
npm run test:e2e     # Playwright
```
