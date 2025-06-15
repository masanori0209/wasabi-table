# 🥷 Ninja Table

WebAssembly + Canvasによる超高速テーブルUIライブラリ

## ✨ 特徴

- **⚡ 極限の高速レンダリング**: WebAssemblyとRustによる最適化されたレンダリングエンジン
- **🎨 Canvas描画**: HTML要素を使わない純粋なCanvas描画で最高のパフォーマンス
- **📱 仮想化スクロール**: 可視領域のみレンダリングして大量データも軽快に処理
- **🔧 フレームワーク対応**: Vanilla JS、React、Vue に対応
- **🎯 型安全**: TypeScript定義ファイル付属
- **🎨 カスタマイズ可能**: テーマ、色、フォントなど柔軟な設定

## 🚀 パフォーマンス目標

- 100万セル以上のデータを60FPSで描画
- スクロール遅延1ms以下
- メモリ使用量最適化

## 📦 インストール

### 前提条件

- Rust (最新stable版)
- wasm-pack
- Node.js

### ビルド

```bash
# 依存関係のインストール
npm install

# WebAssemblyビルド
npm run build

# すべてのターゲット向けビルド
npm run build:all
```

## 🔧 使用方法

### Vanilla JavaScript

```javascript
import init, { NinjaTable } from './pkg/ninja_table.js';

async function initTable() {
    await init();
    
    const canvas = document.getElementById('tableCanvas');
    const table = new NinjaTable(canvas);
    
    // データ設定
    table.set_cell_data(0, 0, "Hello");
    table.set_cell_data(0, 1, "World");
    
    // バッチデータ設定（高速）
    const data = [
        { value: "A1", row: 0, col: 0, width: 100.0, height: 24.0 },
        { value: "B1", row: 0, col: 1, width: 100.0, height: 24.0 }
    ];
    table.set_batch_data(JSON.stringify(data));
    
    // Wasm内イベント処理用のコールバック設定
    table.set_on_cell_select((event) => {
        console.log(`Cell selected: ${event.row}, ${event.col}`);
        table.render(); // 必要に応じて再レンダリング
    });
    
    table.set_on_scroll((event) => {
        console.log(`Scrolled to: ${event.scrollX}, ${event.scrollY}`);
        table.render(); // 必要に応じて再レンダリング
    });
    
    // レンダリング
    table.render();
}
```

### React

```jsx
import NinjaTableReact from './examples/react/NinjaTableReact.jsx';

function App() {
    const [data, setData] = useState([]);
    
    const handleCellSelect = ({ row, col }) => {
        console.log(`Selected cell: ${row}, ${col}`);
    };
    
    return (
        <NinjaTableReact
            width={1000}
            height={600}
            data={data}
            theme="default"
            onCellSelect={handleCellSelect}
        />
    );
}
```

### Vue 3

```vue
<template>
    <NinjaTableVue
        :width="1000"
        :height="600"
        :data="data"
        theme="default"
        @cell-select="handleCellSelect"
    />
</template>

<script setup>
import { ref } from 'vue';
import NinjaTableVue from './examples/vue/NinjaTableVue.vue';

const data = ref([]);

const handleCellSelect = ({ row, col }) => {
    console.log(`Selected cell: ${row}, ${col}`);
};
</script>
```

## ⚙️ 設定オプション

```javascript
const config = {
    row_count: 1000,           // 行数
    col_count: 50,             // 列数
    default_row_height: 24.0,  // デフォルト行高
    default_col_width: 100.0,  // デフォルト列幅
    header_height: 30.0,       // ヘッダー高
    show_grid: true,           // グリッド表示
    grid_color: "#e0e0e0",     // グリッド色
    background_color: "#ffffff", // 背景色
    text_color: "#333333",     // テキスト色
    header_background_color: "#f5f5f5", // ヘッダー背景色
    selected_cell_color: "#3498db",     // 選択セル色
    font_size: 12.0,           // フォントサイズ
    font_family: "Arial, sans-serif"    // フォントファミリー
};

table.update_config(JSON.stringify(config));
```

## 🎨 テーマ

### デフォルトテーマ
明るく見やすいデフォルトテーマ

### ダークテーマ
目に優しいダークモード

### Excel風テーマ
Microsoft Excel風の見た目

## 📊 API リファレンス

### NinjaTable メソッド

| メソッド | 説明 |
|---------|------|
| `new(canvas)` | テーブルインスタンス作成（イベントリスナー自動設定） |
| `set_cell_data(row, col, value)` | セルデータ設定 |
| `get_cell_data(row, col)` | セルデータ取得 |
| `set_batch_data(json)` | バッチデータ設定 |
| `update_config(json)` | 設定更新 |
| `scroll(deltaX, deltaY)` | スクロール（通常は不要、Wasm内で自動処理） |
| `render()` | レンダリング実行 |
| `get_stats()` | 統計情報取得 |
| `set_on_cell_select(callback)` | **NEW** セル選択コールバック設定 |
| `set_on_scroll(callback)` | **NEW** スクロールコールバック設定 |

### イベント処理

- **✨ Wasm内自動処理**: マウスクリック、ホイールスクロール、キーボードナビゲーション
- **⚡ 高速コールバック**: JavaScript側でのイベント処理不要
- **🎯 型安全**: TypeScriptでのイベントオブジェクト型定義

## 🔧 開発

### ローカル開発

```bash
# 開発サーバー起動
npm run serve

# ブラウザで http://localhost:8501/examples/vanilla-js/ を開く
```

### テスト

```bash
npm test
```

### パフォーマンステスト

```bash
# 大量データでのベンチマーク
node benchmarks/performance.js
```

## 📈 ベンチマーク

| データサイズ | レンダリング時間 | メモリ使用量 |
|-------------|----------------|-------------|
| 10,000 セル | 0.8ms | 2MB |
| 100,000 セル | 3.2ms | 8MB |
| 1,000,000 セル | 12.5ms | 24MB |

## 🚀 実行してみる

1. プロジェクトをビルド:
```bash
wasm-pack build --target web --out-dir pkg

wasm-pack build crates/frontend --target bundler --out-dir pkg


```

2. 開発サーバーを起動:
```bash
npm run serve
```

3. ブラウザで `http://localhost:8501/examples/vanilla-js/` を開いてテーブルUIを体験

## 🤝 コントリビューション

1. Fork
2. Feature branch作成
3. Commit
4. Push
5. Pull Request

## 📄 ライセンス

MIT License

## 🔧 今後の予定

- [ ] セル編集機能
- [ ] セル結合機能
- [ ] 条件付き書式
- [ ] CSV/Excel インポート・エクスポート
- [ ] ソート・フィルター機能
- [ ] 列リサイズ
- [ ] 行選択・複数選択
- [ ] キーボードナビゲーション強化
- [ ] アクセシビリティ対応
- [ ] モバイル対応
