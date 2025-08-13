#!/bin/bash

# Build script for chess WASM game

echo "🦀 Building Chess WASM..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed"
    echo "Install with: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

# Build the WASM module
wasm-pack build --target web --out-dir pkg

# Copy files to public directory if it exists
if [ -d "../public" ]; then
    cp pkg/chess_wasm.wasm ../public/
    cp metadata.json ../public/chess_metadata.json
    echo "✅ Copied files to public directory"
fi

echo "✅ Chess WASM build complete"
