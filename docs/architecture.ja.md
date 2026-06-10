# アーキテクチャ概要

[English](./architecture.md)

Wasabi Table の内部構成と、Rust/WASM と TypeScript の責務分界です。

## 全体構成

```
┌─────────────────────────────────────────────────────────┐
│  アプリケーション（React / Vue / 素の HTML 等）          │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  TypeScript ラッパー（src-ts/ → dist/）                  │
│  · WasabiTable クラス、イベント、undo/redo               │
│  · フィルター/ソート、RecordsDataSource、リスナー API    │
│  · DOM: スクロールバー、MenuField、ツールチップ          │
└───────────────────────────┬─────────────────────────────┘
                            │ wasm-bindgen
┌───────────────────────────▼─────────────────────────────┐
│  Rust コア（src/ → pkg/*.wasm）                          │
│  · Canvas 2D 描画、ヒットテスト、スクロール計算          │
│  · セルデータ、選択・編集・クリップボード                │
│  · 列ヘッダー、バリデーション、条件付き書式              │
└─────────────────────────────────────────────────────────┘
```

## なぜ Canvas + WASM か

| 方式 | 特徴 | Wasabi の選択 |
|------|------|---------------|
| DOM テーブル | 実装容易、a11y 向き | 行数増加で DOM コスト大 |
| 仮想 DOM グリッド | 中規模向け | セル数上限・GC プレッシャー |
| **Canvas + WASM** | 描画一括、メモリ制御 | **大規模リスト + Excel 風 UX** |

性能クリティカル path（描画、visible range 計算、ヒットテスト）は Rust に置き、DX（設定 JSON、イベント、フィルター）は TypeScript に置く。

## Rust モジュール（src/）

| モジュール | 責務 |
|------------|------|
| `table.rs` | `WasabiTable` 本体。描画、入力、選択、クリップボード、row_store |
| `types.rs` | `TableConfig`、`ColumnHeader`、`CellRange` 等 |
| `validation.rs` | 列型に基づくセル検証 |
| `format.rs` | 条件付き書式 |
| `render.rs` | 列名生成など描画補助 |
| `edit.rs` | インライン編集 DOM（input オーバーレイ） |

## TypeScript モジュール（src-ts/）

| モジュール | 責務 |
|------------|------|
| `index.ts` | `WasabiTable` 公開クラス、WASM 初期化、canvas イベント配線 |
| `records-data-source.ts` | 大規模 `records[]` と列定義 |
| `filter-sort.ts` | フィルター/ソート（**TS 層**。単体テスト可能） |
| `undo-stack.ts` | undo/redo 履歴 |
| `listeners.ts` | 数式バー（セルエディタ）・統計連携 |
| `header-dialog.ts` | ヘッダー UI（フィルター/ソートダイアログ） |
| `utils.ts` | CSV  export、セル参照パース等 |

### フィルター/ソートが TS 側にある理由

- アプリ側の `records` / イベントと組み合わせやすい
- `filter-sort.ts` を **Wasabi なしで単体テスト・再利用** できる
- WASM 再ビルドなしで演算子追加が可能

表示行の反映は WASM の `set_filtered_rows` 等で行う。

## データモデル

### 1. スパースモード（デフォルト）

```
HashMap<"row:col", CellData>  （Rust data）
```

- `setCellValue` / `set_cell_data` でセル単位に保存
- 中〜小規模、ランダムアクセス向け

### 2. row_store モード（WASM 内）

```
HashMap<row_index, Vec<String>>  （行単位の値配列）
```

- `set_row_batch` / `clear_row_store` で一括投入
- records モードの viewport 同期で使用

### 3. RecordsDataSource（TypeScript）

```typescript
dataSource: {
  records: RecordRow[];      // 論理的に全行（例: 100万行）
  columns: RecordColumnDef[];
}
```

- **全行を WASM に載せない**
- スクロール位置から visible 行範囲を推定し、バッファ付きで `row_store` に同期

## records モードの viewport 同期

```
records[] (TS)                    row_store (WASM)
     │                                   ▲
     │  estimateViewportRowRange()       │
     │  scrollY + canvas height          │
     └──────── syncRecordsViewport() ────┘
              set_row_batch (500行/chunk)
```

定数 `RECORDS_VIEWPORT_BUFFER_ROWS = 40` で上下に余裕を持たせ、高速スクロール時のちらつきを抑える。

セル編集時は `syncRecordsRowToWasm(row)` で該当行のみ更新。

## レンダリングパイプライン（概要）

1. `render()` 呼び出し（TS → WASM）
2. スクロール位置から `visible_rows` / `visible_cols` を計算
3. records モードなら事前に `syncRecordsViewport()`
4. ヘッダー → グリッド線 → セルテキスト → 選択オーバーレイ
5. 条件付き書式・エラー表示を適用

DOM 要素は **編集中の input**、MenuField の select、スクロールバー、ツールチップのみ。セル本体は Canvas。

## イベントフロー

| 入力 | 主な処理場所 |
|------|--------------|
| マウス click / drag | TS が canvas リスナー → WASM `pixel_to_cell` / range selection |
| ホイール | WASM `handle_canvas_wheel` |
| キーボード（矢印、Ctrl+C 等） | TS と WASM の組み合わせ（編集時は TS が優先） |
| インライン編集 | WASM が overlay input を配置、Enter/Tab/Escape |

## ビルド成果物

| 出力 | 内容 |
|------|------|
| `pkg/wasabi_table_bg.wasm` | Rust コア |
| `pkg/wasabi_table.js` | wasm-bindgen グルー |
| `dist/index.js` | TS ラッパー（import パス修正済み） |
| `dist/index.d.ts` | 公開型定義 |

`npm run build` = `wasm-pack` + `tsc` + `fix-imports.js`

## 拡張するときの指針

- **描画・ヒットテスト・大量データ**: Rust を検討
- **UI 連携・ビジネスルール・テスト容易性**: TypeScript を検討
- 新機能は [設計原則](./design-principles.ja.md) と [スコープ外](./positioning.ja.md) に照合
