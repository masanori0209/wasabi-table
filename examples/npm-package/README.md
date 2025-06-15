# 🥷 NinjaTable NPM Package Examples

このディレクトリには、NinjaTable NPMパッケージの使用例が含まれています。

## 📁 ファイル構成

```
examples/npm-package/
├── index.html              # ライブデモページ（HTML + JavaScript）
├── typescript-example.ts   # TypeScript での使用例
├── react-example.tsx       # React での使用例
└── README.md              # このファイル
```

## 🚀 ライブデモページ

### `index.html`

完全に動作するライブデモページです。以下の機能を含みます：

- **インタラクティブなテーブル**: クリック、キーボード操作、スクロール
- **数式バー**: Excel風の数式入力バー
- **設定コントロール**: 行数、列数、サイズ調整
- **サンプルデータ**: 従業員データの例
- **CSV出力**: データのエクスポート機能
- **統計情報**: リアルタイム統計表示

#### 使用方法

1. プロジェクトをビルド:
   ```bash
   npm run build
   ```

2. ブラウザで `examples/npm-package/index.html` を開く

#### 操作方法

- **矢印キー**: セル移動
- **Enter**: 編集開始 / 下のセルに移動
- **F2**: 編集開始（既存値保持）
- **Tab**: 右のセルに移動
- **Escape**: 編集キャンセル
- **Delete/Backspace**: セル内容削除
- **マウスクリック**: セル選択
- **マウスホイール**: スクロール

## 💻 TypeScript 使用例

### `typescript-example.ts`

TypeScriptでの高度な使用例を示します：

- **型安全性**: 完全なTypeScript型定義
- **カスタムクラス**: `SpreadsheetApplication` クラス
- **テーマシステム**: Light/Dark/Excel テーマ
- **イベントハンドリング**: カスタムイベントの発火
- **データ操作**: バッチデータ設定、CSV出力
- **React Hook**: `useNinjaTable` カスタムフック

#### 主な機能

```typescript
// アプリケーションの作成
const app = new SpreadsheetApplication('myCanvas', {
  theme: 'excel',
  row_count: 50,
  col_count: 20
});

await app.initialize();

// サンプルデータの読み込み
app.loadSampleData();

// CSVエクスポート
app.downloadCSV('my-data.csv');
```

## ⚛️ React 使用例

### `react-example.tsx`

Reactでの使用例を示します：

- **カスタムフック**: `useNinjaTable`
- **Reactコンポーネント**: `NinjaTableComponent`
- **状態管理**: React Hooks を使用
- **イベント処理**: React イベントハンドラー
- **UI統合**: React スタイルシステム

#### 基本的な使用方法

```tsx
import { NinjaTableComponent } from './react-example';

function MyApp() {
  return (
    <NinjaTableComponent
      config={{
        row_count: 30,
        col_count: 15,
        default_col_width: 140
      }}
      onCellSelect={(position, cellRef, value) => {
        console.log(`選択: ${cellRef} = "${value}"`);
      }}
    />
  );
}
```

#### カスタムフックの使用

```tsx
function MyCustomTable() {
  const {
    canvasRef,
    table,
    selectedCell,
    setCellValue,
    isLoading,
    error
  } = useNinjaTable({
    row_count: 50,
    col_count: 20
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <canvas ref={canvasRef} width={1000} height={400} />
      <button onClick={() => setCellValue(0, 0, 'Hello')}>
        Set A1 to "Hello"
      </button>
    </div>
  );
}
```

## 📦 インストールと設定

### 基本インストール

```bash
npm install ninja-table
```

### TypeScript プロジェクト

```bash
npm install ninja-table
npm install --save-dev typescript @types/node
```

### React プロジェクト

```bash
npm install ninja-table react @types/react
```

## 🎯 API リファレンス

### NinjaTable クラス

```typescript
class NinjaTable {
  // 静的メソッド
  static create(canvas: HTMLCanvasElement, config: Partial<TableConfig>): Promise<NinjaTable>
  static getCellReference(row: number, col: number): string

  // インスタンスメソッド
  setEventHandlers(handlers: EventHandlers): void
  render(): void
  setCellValue(row: number, col: number, value: string): void
  getCellValue(row: number, col: number): string | undefined
  setBatchData(data: CellData[]): void
  getConfig(): TableConfig
  getStats(): TableStats
  getSelectedCell(): CellPosition | null
  selectCell(row: number, col: number): void
  dispose(): void
}
```

### 設定オプション

```typescript
interface TableConfig {
  row_count: number                    // 行数
  col_count: number                    // 列数
  default_col_width: number            // デフォルト列幅
  default_row_height: number           // デフォルト行高
  header_height?: number               // ヘッダー高
  font_family?: string                 // フォントファミリー
  font_size?: number                   // フォントサイズ
  background_color?: string            // 背景色
  text_color?: string                  // テキスト色
  grid_color?: string                  // グリッド色
  header_background_color?: string     // ヘッダー背景色
  selected_cell_color?: string         // 選択セル色
  show_grid?: boolean                  // グリッド表示
}
```

### イベントハンドラー

```typescript
interface EventHandlers {
  onCellSelect?: (position: CellPosition) => void
  onEditStart?: (position: CellPosition, value: string) => void
  onEditEnd?: (position: CellPosition, value: string) => void
  onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void
}
```

## 🎨 カスタマイズ例

### テーマの適用

```typescript
// ダークテーマ
const darkConfig = {
  background_color: '#2d3748',
  text_color: '#e2e8f0',
  grid_color: '#4a5568',
  header_background_color: '#1a202c',
  selected_cell_color: '#667eea'
};

// Excelライクテーマ
const excelConfig = {
  background_color: '#ffffff',
  text_color: '#000000',
  grid_color: '#d0d7de',
  header_background_color: '#f6f8fa',
  selected_cell_color: '#0969da'
};
```

### 大規模データの処理

```typescript
// 大きなテーブル
const largeTableConfig = {
  row_count: 1000,
  col_count: 50,
  default_col_width: 100,
  default_row_height: 25
};

// バッチデータ設定
const batchData: CellData[] = [
  { row: 0, col: 0, value: 'Header 1' },
  { row: 0, col: 1, value: 'Header 2' },
  // ... 大量のデータ
];

table.setBatchData(batchData);
```

## 🔧 トラブルシューティング

### よくある問題

1. **WebAssembly 初期化エラー**
   ```javascript
   // 解決方法: init() を呼び出してから使用
   import init from 'ninja-table';
   await init();
   const table = await NinjaTable.create(canvas, config);
   ```

2. **Canvas サイズの問題**
   ```javascript
   // 解決方法: CSS と Canvas サイズを一致させる
   canvas.width = 1200;
   canvas.height = 600;
   canvas.style.width = '1200px';
   canvas.style.height = '600px';
   ```

3. **イベントが動作しない**
   ```javascript
   // 解決方法: イベントハンドラーを正しく設定
   table.setEventHandlers({
     onCellSelect: (position) => {
       console.log('Cell selected:', position);
     }
   });
   ```

## 📚 その他のリソース

- [メインREADME](../../README.md)
- [API ドキュメント](../../docs/api.md)
- [使用例集](../usage-examples.md)

## 🤝 コントリビューション

バグ報告や機能要望は [GitHub Issues](https://github.com/your-username/ninja-table/issues) でお願いします。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](../../LICENSE) ファイルを参照してください。 