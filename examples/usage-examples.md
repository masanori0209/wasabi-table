# WasabiTable Usage Examples

[日本語（詳細版）](./usage-examples.ja.md)

## Install

```bash
npm install wasabi-table
```

## Quick start (`createWasabiTableWithListeners`)

```javascript
import { createWasabiTableWithListeners } from 'wasabi-table';

const { table } = await createWasabiTableWithListeners(
  document.getElementById('myCanvas'),
  { row_count: 50, col_count: 10, default_col_width: 120, default_row_height: 28 },
  {
    cellReferenceSelector: '#cellReference',
    formulaInputSelector: '#formulaInput',
    statsElementSelector: '#stats',
  }
);

table.setCellValue(0, 0, 'Hello');
table.render();
```

## Column headers

```typescript
import { WasabiTable, FieldType } from 'wasabi-table';

table.setColumnHeaders(JSON.stringify([
  {
    name: 'email',
    display_name: 'Email',
    width: 180,
    required: true,
    field_type: FieldType.EmailField,
    order: 0,
    is_visible: true,
  },
]));
```

## Themes

```typescript
table.applyTheme('dark');
table.applyTheme(WasabiTable.createCustomTheme('light', {
  selected_cell_color: '#0d6efd',
}));
```

## Live demo

https://masanori0209.github.io/wasabi-table/examples/npm-package/index.html

- `?lang=en` — English UI
- `?lang=ja` — Japanese UI

See also:

- [Getting Started](../docs/getting-started.md)
- [Core API](../docs/api-core.md)
- [npm package examples](./npm-package/README.md)
