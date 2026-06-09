# はじめに

[English](./getting-started.md)

## npm からインストール（公開後）

```bash
npm install wasabi-table
```

```typescript
import { WasabiTable } from 'wasabi-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const table = await WasabiTable.create(canvas);
```

**ライブデモ**: https://masanori0209.github.io/wasabi-table/examples/npm-package/index.html?lang=ja

## リポジトリからのビルド

### 1. ビルド

```bash
npm install
npm run build
```

`pkg/`（WASM）と `dist/`（TypeScript）が生成されます。clone 直後は `npm run build` が必須です。

## 2. 最小 HTML 例

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

## 3. 統合 API（数式バー付き）

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

## 4. ローカルサーバー

ES モジュールの import を解決するため HTTP サーバーが必要です。

```bash
npm run serve
# http://localhost:8501/examples/npm-package/index.html
```

## 5. テスト

```bash
npm run test:unit    # Vitest
npm run test:e2e     # Playwright（録画・trace 対応）
```
