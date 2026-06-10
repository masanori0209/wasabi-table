# フレームワーク統合

[English](./integrations.md)

Wasabi Table は **フレームワーク非依存** です。canvas 要素と npm パッケージだけで動作します。ここでは SPA 向けのベストプラクティスと React 例をまとめます。

## 共通パターン

```typescript
import { WasabiTable } from 'wasabi-table';

// 1. canvas を DOM に用意（tabindex="0" 推奨 — キーボードフォーカス）
// 2. mount 時に create
// 3. unmount 時に dispose()
```

### canvas の注意

- `tabindex="0"` でフォーカス可能にする（矢印キー・Ctrl+C 等）
- 親要素のサイズ変更時は `ResizeObserver` が内部で追従（`WasabiTable.create` 後）
- 高 DPR 環境では canvas サイズが devicePixelRatio を考慮（内部処理）

## ライフサイクル: `dispose()`

SPA で **必ず unmount 時に `dispose()`** を呼んでください。

`dispose()` が行うこと:

- `ResizeObserver` の disconnect
- バリデーションツールチップ DOM の削除
- MenuField select の削除
- カスタムスクロールバーの tear-down
- WASM インスタンスの `free()`

```typescript
const table = await WasabiTable.create(canvas, config);
// ...
table.dispose();
```

E2E でも records テスト後に `dispose()` を呼んでいます（`e2e/records-*.spec.ts`）。

### React Strict Mode（開発時）

React 18 Strict Mode では effect が **二重実行** されます。

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

`cancelled` フラグで、遅延完了した create のインスタンスも dispose します。

## React

公式パッケージ `@wasabi-table/react` は **1.0 時点では未提供**（[roadmap.ja.md](./roadmap.ja.md)）。サンプルを参照:

- [`examples/npm-package/react-example.tsx`](../examples/npm-package/react-example.tsx)

### カスタムフックの要点

1. `useRef<HTMLCanvasElement>` で canvas を保持
2. `useEffect` で `WasabiTable.create` / cleanup で `dispose`
3. 選択・セル値は `setEventHandlers({ onCellSelect, ... })` で React state に反映
4. 数式バー連携は `createWasabiTableWithListeners` を effect 内で使用

### 再レンダリング

- グリッド本体は Canvas。React state 更新のたびに `table.render()` を **毎回呼ぶ必要はない**
- データ更新時は `setCellValue` / `setBatchData` / `setRecords` + `render()`（または内部で render される API）

## Vue / Svelte / その他

同じパターン:

- `onMounted` / `mount` → `WasabiTable.create`
- `onUnmounted` / `destroy` → `dispose`
- オプション変更時は table を作り直すか、公開 API で部分更新

コミュニティ例が増えたら本 doc にリンクを追加。

## リスナー API（Tier 2）

DOM 上の入力バー・セル参照・統計と連携:

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

React ではこれらの要素を JSX で描画し、selector を `id` / `data-testid` で渡します。

## records モード（Tier 3）

```typescript
await WasabiTable.create(canvas, {
  dataSource: {
    records: largeArray,
    columns: [{ field: 'name', header: 'Name', width: 120 }],
  },
});
```

- 配列を in-place 更新したら `table.refresh()`
- 配列差し替えは `table.setRecords(newRecords)`

詳細: [architecture.ja.md](./architecture.ja.md#records-モードの-viewport-同期)

## よくある落とし穴

| 問題 | 対処 |
|------|------|
| キーボードが効かない | canvas に `tabindex="0"`、クリックで focus |
| Strict Mode で WASM が二重 | cancelled + dispose（上記） |
| メモリリーク | unmount で `dispose()` 忘れ |
| import パス | 公開時は `from 'wasabi-table'`。ローカル clone は `npm run build` 後 `dist/` |
| SSR | **非対応** — クライアントのみで dynamic import |

## 関連

- [Getting Started](./getting-started.ja.md)
- [Usage examples](../examples/usage-examples.ja.md)
- [Browser support](./browser-support.ja.md)
