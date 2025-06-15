# 🥷 NinjaTable Monorepo

高性能なExcel風テーブルコンポーネントとイベントリスナーのモノレポです。

## 📦 パッケージ

このモノレポには以下のパッケージが含まれています：

### [`ninja-table`](./packages/core) - コアライブラリ
- Rust + WebAssemblyで構築された高性能テーブルコンポーネント
- Canvas ベースのレンダリング
- 大量データの高速処理

### [`ninja-table-listeners`](./packages/listeners) - イベントリスナー
- フォーミュラバー機能
- リアルタイム検証
- IME（日本語入力）対応
- キーボードショートカット

## 🚀 クイックスタート

### インストール

```bash
# モノレポ全体の依存関係をインストール
npm run install:all

# または個別にインストール
npm install
npm install -w packages/core
npm install -w packages/listeners
```

### ビルド

```bash
# 全パッケージをビルド
npm run build

# 個別にビルド
npm run build:core
npm run build:listeners
```

### 開発

```bash
# 全パッケージを開発モードで起動
npm run dev

# 個別に開発モード
npm run dev:core
npm run dev:listeners
```

## 📖 使用方法

### 基本的な使用例

```typescript
import { NinjaTable } from 'ninja-table';
import { createNinjaTableListeners } from 'ninja-table-listeners';

// テーブルを作成
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const table = await NinjaTable.create(canvas, {
  row_count: 50,
  col_count: 10
});

// リスナーを追加
const listeners = createNinjaTableListeners(table, {
  cellReferenceSelector: '#cellReference',
  formulaInputSelector: '#formulaInput'
});
```

### HTML構造

```html
<div class="formula-bar">
  <div id="cellReference">A1</div>
  <input type="text" id="formulaInput" placeholder="セルの内容を入力...">
</div>
<canvas id="myCanvas" width="1200" height="500"></canvas>
```

## 🛠️ 開発

### 利用可能なスクリプト

```bash
# ビルド
npm run build              # 全パッケージ
npm run build:core         # コアのみ
npm run build:listeners    # リスナーのみ

# 開発
npm run dev                # 全パッケージ（ウォッチモード）
npm run dev:core           # コアのみ
npm run dev:listeners      # リスナーのみ

# テスト
npm run test               # 全パッケージ

# リント
npm run lint               # 全パッケージ

# クリーンアップ
npm run clean              # 全パッケージ

# サーバー起動
npm run serve              # Python HTTP サーバー
npm run serve:node         # Node.js HTTP サーバー
```

### モノレポ構造

```
ninja-table/
├── packages/
│   ├── core/                    # ninja-table コアパッケージ
│   │   ├── src/                 # Rust ソースコード
│   │   ├── src-ts/              # TypeScript ソースコード
│   │   ├── pkg/                 # WebAssembly 出力
│   │   ├── dist/                # TypeScript ビルド出力
│   │   ├── Cargo.toml           # Rust 設定
│   │   ├── package.json         # npm パッケージ設定
│   │   └── README.md            # コア固有のドキュメント
│   └── listeners/               # ninja-table-listeners パッケージ
│       ├── src/                 # TypeScript ソースコード
│       ├── dist/                # ビルド出力
│       ├── package.json         # npm パッケージ設定
│       └── README.md            # リスナー固有のドキュメント
├── examples/                    # 使用例
├── package.json                 # ワークスペース設定
└── README.md                    # このファイル
```

## 🔧 技術スタック

- **Rust**: 高性能なコア処理
- **WebAssembly**: ブラウザでのRust実行
- **TypeScript**: 型安全なJavaScript
- **Canvas API**: 高速レンダリング
- **npm Workspaces**: モノレポ管理

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題が発生した場合は、[GitHub Issues](https://github.com/yourusername/ninja-table/issues) でお知らせください。
