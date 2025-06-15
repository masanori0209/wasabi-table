#!/bin/bash

# 必要なツールのインストール
cargo install wasm-pack

# ビルド
wasm-pack build --target web

# ビルド結果を確認
echo "Build completed. Check the pkg directory for the output." 