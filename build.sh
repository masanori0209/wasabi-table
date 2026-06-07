#!/bin/bash
set -euo pipefail

echo "Building Wasabi Table..."

if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack is not installed. Install: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

wasm-pack build --target web --out-dir pkg
npm run build:ts
npm run fix-imports

echo "Build completed."
