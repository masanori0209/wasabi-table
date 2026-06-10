# グリッド選定ガイド

[English](./choosing-a-grid.md)

Wasabi Table が **向く / 向かない** 場面の中立ガイドです。[ポジショニング](./positioning.ja.md) の競合記述ルールに従い、優劣の断言は避けます。

## Wasabi Table とは

Canvas + Rust/WASM の **Excel 風データグリッド**。一覧表示・セル編集・大規模 records に特化。フルスプレッドシートではありません。

## 向いているケース

| シナリオ | 理由 |
|----------|------|
| SaaS 管理画面のマスタ一覧 | 列定義 + バリデーション + キーボード操作 |
| 社内ツールの編集可能グリッド | npm 数行で始められる |
| **10万〜100万行級**の参照・軽編集 | records + viewport 同期 |
| DOM グリッドが重いと感じる画面 | Canvas 一括描画 |
| フレームワークを固定したくない | canvas ベース、React 等はラップのみ |

## 向いていないケース

| シナリオ | 代わりに検討 |
|----------|--------------|
| 数式（`=SUM` 等）が必要 | フルスプレッドシート製品 |
| ピボット・チャート連携 | BI / スプレッドシート系 |
| セル結合が必須 | 表組み特化 UI |
| headless で表の markup を完全制御 | Headless テーブルライブラリ |
| Node.js サーバー上だけで完結 | Wasabi は **ブラウザ + WASM + Canvas** 専用 |
| リアルタイム共同編集 | 専用コラボ製品 / 自前 OT |
| アクセシビリティを DOM テーブル同等必須 | Canvas の制約を許容できるか要評価（[browser-support.ja.md](./browser-support.ja.md)） |

## カテゴリ別の位置づけ

製品名ではなく **カテゴリ** で選ぶとすり合わせが容易です。

```
必要なもの
    │
    ├─ 数式・ピボット・帳票 ──────────► フルスプレッドシート系
    │
    ├─ UI は自前、表ロジックだけ ─────► Headless テーブル
    │
    ├─ エンタープライズ全機能 DOM ────► 大規模 DOM グリッド
    │
    └─ 大規模リスト + Excel 風編集 ───► Canvas データグリッド
                                              │
                                              └─ Wasabi Table
```

## Canvas データグリッドを選ぶときのチェックリスト

- [ ] 行数が多い（または増える見込み）
- [ ] セル編集・コピペ・undo が必要
- [ ] 数式エンジンは **不要**
- [ ] モダンブラウザ（ESM + WASM）でよい
- [ ] 自社ベンチで性能を確認したい → [benchmark.html](../examples/npm-package/benchmark.html)

## records API について

Wasabi の `dataSource.records` は、Canvas 系グリッドで一般的な **「論理全行 + 表示は viewport だけ WASM に載せる」** パターンです。

- 他製品の records API と **互換ではありません**
- 思想が近い製品を選ぶ場合は、各 docs のデータ绑定章を比較してください（機能表の名指し比較は [positioning](./positioning.ja.md) で非推奨）

## 段階的導入の目安

| 段階 | 必要な機能 | Wasabi の Tier |
|------|------------|----------------|
| PoC | 表示 + クリック編集 | Tier 1 |
| 業務画面 | 列型・バリデーション・入力バー | Tier 2 |
| 本番大量データ | records・フィルター・テーマ | Tier 3 |

詳細: [positioning.ja.md](./positioning.ja.md#ユーザー動線progressive-disclosure)

## まだ迷う場合

1. [Getting Started](./getting-started.ja.md) で Tier 1 を 30 分試す
2. [benchmark.html](../examples/npm-package/benchmark.html) で自環境の行数を測る
3. 数式・ピボットが **1つでも** 必須なら Wasabi は候補から外す

質問は [GitHub Issues](https://github.com/masanori0209/wasabi-table/issues) へ（選定相談 OK）。
