# WasabiTable NPM Package Examples

[日本語](./README.ja.md)

Live demo and integration examples for the `wasabi-table` npm package.

## Files

```
examples/npm-package/
├── index.html          # Live demo (EN/JA via language switcher)
├── i18n.js             # Demo page translations
├── styles.css          # Retro Wasabi theme
├── code-loader.js      # Code tab examples
└── README.ja.md        # Detailed Japanese guide
```

## Live demo

```bash
npm run build
npm run serve
# http://localhost:8501/examples/npm-package/index.html
```

- **English UI**: add `?lang=en`
- **Japanese UI**: add `?lang=ja` (or use the EN / 日本語 switcher in the header)

## Quick integration

```javascript
import { createWasabiTableWithListeners } from 'wasabi-table';

const { table } = await createWasabiTableWithListeners(
  document.getElementById('myCanvas'),
  { row_count: 50, col_count: 10 },
  {
    cellReferenceSelector: '#cellReference',
    formulaInputSelector: '#formulaInput',
    statsElementSelector: '#stats',
  }
);
```

## Documentation

- [Getting Started](../../docs/getting-started.md)
- [Core API](../../docs/api-core.md)
- [Usage examples](../usage-examples.md)
