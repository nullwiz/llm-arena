#!/bin/bash

echo "🦀 Building WASM modules..."

# Check if wasm-pack is available
if ! command -v wasm-pack &> /dev/null; then
    echo "⚠️  wasm-pack not found. Checking if pre-built WASM files exist..."

    if [ -f "public/chess_wasm.wasm" ] && [ -f "public/tictactoe_wasm.wasm" ]; then
        echo "✅ Pre-built WASM files found in public directory"
        echo "   Using existing WASM files for deployment"
        exit 0
    else
        echo "❌ No pre-built WASM files found and wasm-pack is not available"
        echo "   Install wasm-pack with: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
        exit 1
    fi
fi

echo "📦 Building Chess WASM..."
cd rust-chess
if [ -f "build.sh" ]; then
    chmod +x build.sh
    if ./build.sh; then
        echo "✅ Chess WASM built successfully"
    else
        echo "⚠️  Chess WASM build failed, using pre-built version"
    fi
else
    echo "⚠️  No build.sh found in rust-chess, using pre-built version"
fi
cd ..

echo "📦 Building Tic-Tac-Toe WASM..."
cd rust-tictactoe
if [ -f "build.sh" ]; then
    chmod +x build.sh
    if ./build.sh; then
        echo "✅ Tic-Tac-Toe WASM built successfully"
    else
        echo "⚠️  Tic-Tac-Toe WASM build failed, using pre-built version"
    fi
else
    echo "⚠️  No build.sh found in rust-tictactoe, using pre-built version"
fi
cd ..

echo "✅ WASM build complete!"
