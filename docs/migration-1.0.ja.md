# 0.x → 1.0.0 移行ガイド

[English](./migration-1.0.md)

Wasabi Table **1.0.0** は公開 TypeScript API の安定宣言です。

## 破壊的変更

**0.9.x から 1.0.0 への破壊的変更はありません**（semver 初の major は API 約束の宣言）。

0.x 中に導入した API 追加のみ:

| API | 導入 |
|-----|------|
| `setColumnWidth` / `getColumnWidth` | 0.2.0 |
| `freeze_cols` / `freeze_rows`（`TableConfig`） | 0.3.0 |
| 行ヘッダークリックによる行選択 | 0.3.0（操作追加、API 変更なし） |

## 推奨アップグレード手順

1. `npm install wasabi-table@1.0.0`
2. `npm run build`（ソース利用時 — WASM 再ビルド）
3. E2E / 手動で以下を確認:
   - 列リサイズ（ヘッダー端）
   - records + filter（`isActive: true` on conditions）
   - SPA で `dispose()` on unmount
4. [browser-support](./browser-support.ja.md) — Node/SSR 非対応は変わらず

## WASM 直接 API

snake_case の WASM メソッドは引き続き **非安定** です。1.0 でも semver 対象外 — [api-stability](./api-stability.ja.md)

## 問題報告

https://github.com/masanori0209/wasabi-table/issues
