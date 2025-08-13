#!/bin/bash

echo "🦀 Preparing WASM modules for CI/CD..."

# Check if pre-built WASM files exist
if [ -f "public/chess_wasm.wasm" ] && [ -f "public/tictactoe_wasm.wasm" ]; then
    echo "✅ Pre-built WASM files found:"
    echo "   - Chess WASM: $(ls -lh public/chess_wasm.wasm | awk '{print $5}')"
    echo "   - Tic-Tac-Toe WASM: $(ls -lh public/tictactoe_wasm.wasm | awk '{print $5}')"
    echo "   - Chess metadata: public/chess_metadata.json"
    echo "   - Tic-Tac-Toe metadata: public/tictactoe_metadata.json"
    echo "✅ WASM modules ready for deployment"
    exit 0
else
    echo "❌ Pre-built WASM files not found"
    echo "   Expected files:"
    echo "   - public/chess_wasm.wasm"
    echo "   - public/tictactoe_wasm.wasm"
    echo "   - public/chess_metadata.json"
    echo "   - public/tictactoe_metadata.json"
    exit 1
fi
