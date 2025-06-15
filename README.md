# 🥷 NinjaTable

高性能なExcel風テーブルコンポーネント - Rust + WebAssembly + Canvas で構築

[![npm version](https://badge.fury.io/js/ninja-table.svg)](https://badge.fury.io/js/ninja-table)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特徴

- 🚀 **超高速レンダリング**: Rust + WebAssembly による最適化されたパフォーマンス
- 📊 **Excel風操作**: キーボードナビゲーション、セル編集、数式バー
- 🎯 **TypeScript完全対応**: 型安全性とIntelliSenseサポート
- 🎨 **Canvas描画**: 滑らかなスクロールと高品質な描画
- 🔧 **カスタマイズ可能**: 豊富な設定オプション
- 📱 **レスポンシブ**: モダンブラウザ対応
- 🪶 **軽量**: 最小限の依存関係

## 📦 インストール

```bash
npm install ninja-table
```

## 🚀 クイックスタート

### JavaScript

```javascript
import { NinjaTable } from 'ninja-table';

async function init() {
  const canvas = document.getElementById('myCanvas');
  const table = await NinjaTable.create(canvas, {
    row_count: 50,
    col_count: 10
  });

  // セルに値を設定
  table.setCellValue(0, 0, 'Hello World');
  table.render();
}

init();
```

### TypeScript

```typescript
import { NinjaTable, TableConfig, CellPosition } from 'ninja-table';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

const config: Partial<TableConfig> = {
  row_count: 100,
  col_count: 26,
  default_col_width: 120,
  default_row_height: 30
};

const table = await NinjaTable.create(canvas, config);

table.setEventHandlers({
  onCellSelect: (position: CellPosition) => {
    console.log(`Selected: ${NinjaTable.getCellReference(position.row, position.col)}`);
  }
});

table.render();
```

## 📖 API リファレンス

### NinjaTable クラス

#### 静的メソッド

- `NinjaTable.create(canvas, config?)` - テーブルインスタンスを作成
- `NinjaTable.getColumnName(col)` - 列名を生成 (A, B, C, ...)
- `NinjaTable.getCellReference(row, col)` - セル参照を生成 (A1, B2, ...)

#### インスタンスメソッド

- `setCellValue(row, col, value)` - セルに値を設定
- `getCellValue(row, col)` - セルの値を取得
- `setBatchData(data)` - 複数セルを一括設定
- `render()` - テーブルをレンダリング
- `selectCell(row, col)` - セルを選択
- `getSelectedCell()` - 選択中のセルを取得
- `startEditing(row, col)` - セル編集を開始
- `isEditing()` - 編集中かどうかを確認
- `getStats()` - 統計情報を取得
- `getConfig()` - 設定を取得
- `setEventHandlers(handlers)` - イベントハンドラーを設定
- `dispose()` - リソースを解放

### インターフェース

#### TableConfig

```typescript
interface TableConfig {
  row_count: number;           // 行数
  col_count: number;           // 列数
  default_col_width: number;   // デフォルト列幅
  default_row_height: number;  // デフォルト行高
  header_height: number;       // ヘッダー高
  font_family: string;         // フォントファミリー
  font_size: number;           // フォントサイズ
  font_style: string;          // フォントスタイル
  background_color: string;    // 背景色
  text_color: string;          // テキスト色
  grid_color: string;          // グリッド色
  header_background_color: string; // ヘッダー背景色
  selected_cell_color: string; // 選択セル色
  show_grid: boolean;          // グリッド表示
}
```

#### EventHandlers

```typescript
interface EventHandlers {
  onCellSelect?: (position: CellPosition) => void;
  onEditStart?: (position: CellPosition, value: string) => void;
  onEditEnd?: (position: CellPosition, value: string) => void;
  onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void;
}
```

## 🎮 操作方法

### キーボード操作

- `矢印キー` - セル移動
- `Enter` - 編集開始 / 下のセルに移動
- `F2` - 編集開始（既存値保持）
- `Tab` - 右のセルに移動
- `Escape` - 編集キャンセル
- `Delete/Backspace` - セル内容削除
- `文字キー` - 直接編集開始

### マウス操作

- `クリック` - セル選択
- `ホイール` - スクロール
- `ダブルクリック` - 編集開始（予定）

## 🎨 カスタマイズ例

```typescript
const customConfig: Partial<TableConfig> = {
  row_count: 200,
  col_count: 50,
  default_col_width: 150,
  default_row_height: 35,
  font_family: 'Monaco, monospace',
  font_size: 14,
  background_color: '#fafafa',
  text_color: '#333333',
  grid_color: '#e0e0e0',
  header_background_color: '#f0f0f0',
  selected_cell_color: '#007acc'
};

const table = await NinjaTable.create(canvas, customConfig);
```

## 📊 パフォーマンス

- **大規模データ**: 100万セル以上をスムーズに処理
- **仮想化**: 表示領域のみをレンダリング
- **メモリ効率**: 必要最小限のメモリ使用
- **60fps**: 滑らかなスクロールとアニメーション

## 🌐 ブラウザ対応

| ブラウザ | バージョン |
|---------|-----------|
| Chrome  | 80+       |
| Firefox | 79+       |
| Safari  | 14+       |
| Edge    | 80+       |

WebAssemblyをサポートするモダンブラウザで動作します。

## 🔧 開発

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/ninja-table.git
cd ninja-table

# 依存関係をインストール
npm install

# WebAssemblyをビルド
npm run build:wasm

# TypeScriptをビルド
npm run build:ts

# 全体をビルド
npm run build

# 開発モード
npm run dev
```

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [wasm-pack](https://github.com/rustwasm/wasm-pack) - WebAssemblyビルドツール
- [web-sys](https://github.com/rustwasm/wasm-bindgen/tree/master/crates/web-sys) - Web API バインディング

## 📞 サポート

- 🐛 バグ報告: [Issues](https://github.com/yourusername/ninja-table/issues)
- 💡 機能要望: [Discussions](https://github.com/yourusername/ninja-table/discussions)
- 📧 メール: your.email@example.com

---

Made with ❤️ and 🦀 Rust
