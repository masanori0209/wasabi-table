# 設計原則

[English](./design-principles.md)

機能追加・PR レビュー・ドキュメント文案の判断基準です。[ポジショニング](./positioning.ja.md) と併用してください。

## 1. シンプルがデフォルト、深さは opt-in

- **Tier 1**（3行で表示）が常に最短 path
- 高度な機能（records、フィルター、カスタムテーマ）は **明示的な API** で開く
- デフォルト設定（`DEFAULT_CONFIG`）で「それっぽく」動く

## 2. 性能クリティカル path は Rust

次は WASM コアを第一候補とする:

- Canvas 描画と visible range 計算
- ヒットテスト（pixel → cell）
- 大規模 row_store の batch 投入
- セルバリデーション（ホット path）

TS だけで足りるなら TS に置く（[architecture.ja.md](./architecture.ja.md) 参照）。

## 3. DOM を増やさない

- セル本体は Canvas。DOM は編集 overlay・MenuField・スクロールバー・ツールチップに限定
- 「セルごと `<td>`」パターンは採用しない

## 4. フレームワーク非依存

- コアは **canvas + npm パッケージ**
- React/Vue 統合は docs とサンプルで示す（[integrations.ja.md](./integrations.ja.md)）
- 特定フレームワーク必須の API は 1.0 スコープ外

## 5. Excel 風 UX、スプレッドシート機能ではない

- キーボード・選択・コピペ・undo は Excel **風**
- 数式エンジン・ピボット・セル結合は **やらない**（スコープ外リスト参照）
- 「数式バー」= セル値エディタ（名称が誤解を招く場合は docs で補足）

## 6. 追加前にスコープを照合

新機能 PR では次を確認:

1. [positioning.ja.md のスコープ外](./positioning.ja.md#10-スコープ外明示する) に該当しないか
2. Tier 1 の簡潔さを損なわないか（デフォルト behavior / bundle）
3. E2E または unit で再現手順を残せるか
4. 日英 docs の更新が必要か

## 7. 計測可能な主张

- 性能改善 PR には **ベンチまたは再現手順** を添える
- 「速い」だけの文案は [positioning の競合ルール](./positioning.ja.md#競合比較に関する記述ルール) に従い避ける

## 8. 安全と明示的な破壊

- ユーザー入力は `textContent` 等で XSS を避ける（tooltip 等）
- 破壊的 API 変更は [api-stability.ja.md](./api-stability.ja.md) に従い CHANGELOG 必須
- `dispose()` で WASM / Observer / DOM を確実に解放（SPA 向け）

## 9. テストは層ごとに

| 層 | 手段 |
|----|------|
| filter-sort 等 TS 純粋ロジック | Vitest |
| Rust ユーティリティ | `cargo test` |
| WASM ブラウザ | `wasm-pack test` |
| ユーザー操作 | Playwright E2E |

詳細: [testing.ja.md](./testing.ja.md)

## 10. ドキュメントは日英ペア

- ユーザー向け docs は `.md` / `.ja.md` のペア
- 片方だけ更新しない（CI で検知は将来検討）

## アンチパターン

- README に競合比較表を載せる → [positioning](./positioning.ja.md)
- デフォルトで 100万行相当のデータをロードする
- 公開 API を増やさず WASM だけ拡張して TS から直叩き依存
- a11y を「後で」— 最低限のキーボード説明は早めに docs 化
