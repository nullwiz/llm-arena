#!/bin/bash

set -e

echo "🦀 Building WASM modules..."

echo "📦 Building Chess WASM..."
cd rust-chess
if [ -f "build.sh" ]; then
    chmod +x build.sh
    ./build.sh
else
    echo "⚠️  No build.sh found in rust-chess, skipping..."
fi
cd ..

echo "📦 Building Tic-Tac-Toe WASM..."
cd rust-tictactoe
if [ -f "build.sh" ]; then
    chmod +x build.sh
    ./build.sh
else
    echo "⚠️  No build.sh found in rust-tictactoe, skipping..."
fi
cd ..

echo "✅ WASM build complete!"
