# Wasabi Table

高速で軽量なExcel風テーブルコンポーネント。Rust + WebAssemblyで構築され、Canvas APIを使用してレンダリングします。

## 📁 プロジェクト構成

### [`wasabi-table`](./packages/core) - コアライブラリ
- Rust + WebAssemblyで実装された高性能テーブルエンジン
- Canvas APIベースのレンダリング
- 大量データの効率的な処理

### [`wasabi-table-listeners`](./packages/listeners) - イベントリスナー
- TypeScriptで実装されたイベント処理システム
- キーボード・マウス操作のハンドリング
- Excel風のユーザーインターフェース

## ✨ 主な機能

### 🚀 高性能レンダリング
- **Canvas API**: DOMを使わない軽量レンダリング
- **WebAssembly**: Rustで実装された高速計算エンジン
- **仮想化**: 大量データでもスムーズなスクロール

### 📊 Excel風インターフェース
- **セル選択**: 単一セル・範囲選択
- **キーボードナビゲーション**: 矢印キー・Tab・Enter
- **編集機能**: インライン編集・コピー&ペースト
- **リサイズ**: 列幅・行高の調整

### 🔧 開発者フレンドリー
- **TypeScript**: 型安全なAPI
- **モジュラー設計**: 必要な機能のみ使用可能
- **カスタマイズ**: テーマ・スタイルの変更

## 🚀 クイックスタート

### インストール

```bash
npm install wasabi-table
```

### 基本的な使用方法

```typescript
import { WasabiTable } from 'wasabi-table';
import { createWasabiTableListeners } from 'wasabi-table-listeners';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const table = await WasabiTable.create(canvas);

// データを設定
table.setCellValue(0, 0, 'Hello');
table.setCellValue(0, 1, 'World');

// レンダリング
table.render();
```

### Canvas リサイズ機能

WasabiTableは、Canvasのサイズが変更されたときに自動的にテーブルのレイアウトを調整する機能を提供します。

```typescript
// 手動でCanvasサイズを更新
table.updateCanvasSize(800, 600);

// 親要素のサイズに合わせて自動調整
table.updateCanvasSize(); // 引数なしで親要素サイズに合わせる

// 自動リサイズ監視を有効にする（推奨）
// create時に自動的に有効になりますが、手動で設定することも可能
table.setupResizeObserver();
```

#### 主な機能：
- **自動セル描画更新**: リサイズ時にセルが正しく再描画される
- **スクロールバー自動調整**: 新しいサイズに合わせてスクロールバーが調整される
- **レスポンシブ対応**: ウィンドウリサイズやコンテナサイズ変更に対応
- **ResizeObserver監視**: 効率的なサイズ変更検出

## 📚 ドキュメント

### API リファレンス
- [Core API](./docs/api-core.md)
- [Listeners API](./docs/api-listeners.md)
- [Configuration](./docs/configuration.md)

### ガイド
- [Getting Started](./docs/getting-started.md)
- [Customization](./docs/customization.md)
- [Performance Tips](./docs/performance.md)

## 🏗️ 開発

### 前提条件
- Node.js 18+
- Rust 1.70+
- wasm-pack

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/wasabi-table.git
cd wasabi-table

# 依存関係をインストール
npm install

# ビルド
npm run build

# 開発サーバーを起動
npm run serve
```

### プロジェクト構造

```
wasabi-table/
├── src/                       # Rustソースコード
│   ├── core/                    # wasabi-table コアパッケージ
│   │   ├── table.rs           # メインテーブル実装
│   │   ├── render.rs          # レンダリングエンジン
│   │   ├── events.rs          # イベント処理
│   │   └── types.rs           # 型定義
│   └── wasm/                  # WebAssembly バインディング
├── src-ts/                    # TypeScriptソースコード
│   ├── index.ts              # メインエントリーポイント
│   ├── listeners/               # wasabi-table-listeners パッケージ
│   │   ├── keyboard.ts        # キーボードイベント
│   │   ├── mouse.ts           # マウスイベント
│   │   └── index.ts           # リスナーエントリーポイント
│   └── utils/                 # ユーティリティ
├── examples/                  # 使用例
├── docs/                      # ドキュメント
└── pkg/                       # ビルド出力
```

### ビルドコマンド

```bash
# 完全ビルド
npm run build

# Rustのみビルド
npm run build:rust

# TypeScriptのみビルド
npm run build:ts

# 開発モード（ウォッチ）
npm run dev
```

## 🤝 コントリビューション

コントリビューションを歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🐛 バグ報告・機能要望

問題が発生した場合は、[GitHub Issues](https://github.com/yourusername/wasabi-table/issues) でお知らせください。

## 📊 パフォーマンス

- **大量データ**: 100万セルでもスムーズ
- **メモリ効率**: 仮想化による低メモリ使用量
- **レンダリング**: 60fps でのスムーズスクロール
- **起動時間**: 軽量なWebAssemblyモジュール
