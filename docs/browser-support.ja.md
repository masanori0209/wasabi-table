# ブラウザサポート

[English](./browser-support.md)

Wasabi Table の実行環境と制限です。

## サポート方針

| 環境 | サポート |
|------|----------|
| **モダンデスクトップブラウザ** | 対象（下表） |
| **Node.js のみ** | **非対応** |
| **SSR（サーバー描画）** | **非対応** |
| **モバイル** | ベストエフォート（1.0: 基本タップ選択・スクロール対応 — [roadmap.ja.md](./roadmap.ja.md)） |

## 対応ブラウザ（想定）

ES Modules + WebAssembly + Canvas 2D が利用できる **最新版** を想定します。

| ブラウザ | 備考 |
|----------|------|
| Chrome / Edge（Chromium） | CI E2E の primary |
| Firefox | 手動確認推奨 |
| Safari（macOS / iOS） | WASM + Canvas 対応版。手動確認推奨 |

正確な最小バージョンは 1.0 前に E2E / 手動表で確定予定。現時点では README と同様 **「最新版」** を目安にしてください。

## 必須 Web API

- `HTMLCanvasElement` + `CanvasRenderingContext2d`
- WebAssembly（`WebAssembly.instantiate`）
- ES Modules（`import` / `export`）
- Clipboard API（コピー/ペースト — 権限が必要な環境あり）
- `ResizeObserver`（コンテナリサイズ追従）

## Node.js 非対応の理由

- コアは **WASM + Canvas** 前提
- `document` / `canvas` / ブラウザイベントに依存
- サーバー側で表データを処理する場合は `filter-sort.ts` 等 TS モジュールのみ利用可能（グリッド UI なし）

## 高解像度（Retina）

- 内部で `devicePixelRatio` を考慮して canvas バッファサイズを設定
- デモ・ベンチの `setupCanvas` パターンも DPR を scale

## クリップボード

- E2E では `clipboard-read` / `clipboard-write` 権限を付与（Playwright）
- 本番では **HTTPS** または localhost での利用を推奨
- 一部ブラウザでは paste がユーザー gesture 必須

## アクセシビリティ（現状と目標）

| 項目 | 現状 |
|------|------|
| キーボード操作 | 矢印、Enter/F2 編集、Ctrl+C/V/X、Shift+矢印範囲選択等 |
| スクリーンリーダー | Canvas セル内容の自動読み上げは **限定的** |
| フォーカス | canvas の `tabindex` 推奨 |

1.0 目標: role / キーボード操作の docs 明記、必要に応じ aria 属性の改善（[roadmap.ja.md](./roadmap.ja.md) Phase B）。

DOM テーブル同等の a11y が必須な場合は [choosing-a-grid.ja.md](./choosing-a-grid.ja.md) を参照。

## モバイル / タッチ

- **1.0**: タッチイベントをマウス相当に転送 — タップ選択・スクロール（E2E: `e2e/touch.spec.ts`）
- 未整備: タッチ専用ジェスチャ、仮想キーボードとの編集競合の最適化

## トラブルシューティング

| 症状 | 確認 |
|------|------|
| `import` が失敗 | HTTP(S) サーバー経由か（`file://` 不可） |
| WASM 読み込みエラー | `npm run build` で `pkg/` 生成済みか |
| 真っ白 | canvas サイズ 0、親 `display:none` で mount していないか |
| ぼやける | DPR scale 済みか（integrations 参照） |
| ペースト不可 | HTTPS、ユーザー操作、ブラウザ権限 |

## 関連

- [Getting Started](./getting-started.ja.md)
- [Integrations](./integrations.ja.md)
