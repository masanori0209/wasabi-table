# API 安定性ポリシー

[English](./api-stability.md)

Wasabi Table の **公開 API** の定義と、semver・破壊的変更の扱いです。v1.0.0 はこのポリシーに従った安定宣言となります。

## バージョンの正

| 対象 | ソース |
|------|--------|
| ユーザー向け semver | **`package.json`（npm）** |
| Rust crate | リリース時に npm と **同期**（現状 0.1.0 ズレは解消予定） |

## 公開 API（Stable 対象）

`wasabi-table` の npm エントリから import できるものが公開 API です。型定義は `dist/index.d.ts` を正とします。

### クラス・関数

- `WasabiTable` クラス（`create` 含む全 public メソッド）
- `createWasabiTableWithListeners`
- `WasabiTableListeners`
- `RecordsDataSource`
- `HeaderDialogController`（export されている場合）

### 型・定数・ユーティリティ

- `dist/index.d.ts` および `dist/index.js` から **re-export されている** 型・定数・関数
  - 例: `TableConfig`, `ColumnHeader`, `EventHandlers`, `FieldType`, `DEFAULT_CONFIG`
  - 例: `applyFilterSort`, `generatePersonRecords`, `exportTableToCSV`, `parseCellReference`

### 動作保証

- 同一 major 内では、公開 API の **シグネチャと意味** を維持
- バグ修正は patch
- 後方互換な追加は minor（1.0 以降）

## 非公開・上級 API（Stable 対象外）

次は **破壊的変更があり得ます**。Issue なしでの互換保証はしません。

| 対象 | 説明 |
|------|------|
| WASM 直叩き | `set_cell_data`, `handle_canvas_keydown` 等 snake_case メソッド |
| `pkg/` 内部 | wasm-bindgen 生成コードの詳細 |
| `ExtendedWasmWasabiTable` 等 | TS 内部型 |
| 未 export のモジュール | `src-ts/` 直下で index から export されていないもの |

上級者向けの WASM API は [api-core.ja.md](./api-core.ja.md) 「Rust / WASM 直接 API（参考）」に記載。**参考情報**であり、semver の対象外です。

## 0.x と 1.0 以降

| 期間 | 破壊的変更 |
|------|------------|
| **0.x** | 許容。CHANGELOG に `### Changed` / 移行メモを記載 |
| **0.9.x** | 1.0 前の **最後の整理窓**。可能な限りここで完結 |
| **1.0 以降** | [SemVer](https://semver.org/) 厳守。破壊的変更は **major** のみ |

## Deprecated（非推奨）の付け方

1. minor で `@deprecated` JSDoc + docs に代替 API を記載
2. 最低 **1 minor** 経過後、major で削除
3. CHANGELOG に `Deprecated` セクション

0.x では deprecated 期間を短縮してよいが、0.9 → 1.0 では削除前に必ず CHANGELOG で告知。

## 破壊的変更の例

- public メソッドの削除・リネーム
- 引数・戻り値の型変更（より狭い型への変更含む）
- デフォルト動作の変更（Excel 風 UX に影響する場合は特に注意）
- export の削除

## 非破壊的変更の例

- 新メソッド・新オプション（既存呼び出しはそのまま動く）
- 新しい `FieldType`
- バグ修正（意図した仕様への復帰）
- 内部 Rust 最適化（公開 API 挙動不変）

## 1.0 前チェックリスト

- [ ] `dist/index.d.ts` と [api-core](./api-core.ja.md) の一覧が一致
- [ ] WASM-only API に「参考・非安定」の注記
- [ ] CHANGELOG に 0.x → 1.0 の breaking 有無を明記
- [ ] npm / Cargo バージョン同期

## 移行サポート

- 0.x → 1.0: CHANGELOG + 必要なら `docs/migration-1.0.ja.md`（0.9 時点で作成）
- 破壊的変更がある場合、使用例（`examples/usage-examples.ja.md`）を同時更新
