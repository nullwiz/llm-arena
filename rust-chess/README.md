# Chess WASM Engine

A WebAssembly chess engine for the LLM Arena platform.

## Building

```bash
# Install wasm-pack if not already installed
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build the WASM module
wasm-pack build --target web --out-dir pkg

# The output will be in pkg/chess_wasm.wasm
```

## Features

- Full chess rules implementation
- UCI move notation support
- FEN position handling
- Check/checkmate/stalemate detection
- Human-readable board rendering

## Interface

Implements the standard WASM game interface required by LLM Arena:
- `get_initial_state()` - Returns starting position
- `get_valid_moves(state)` - Returns legal moves in UCI format
- `apply_move(state, move)` - Applies move and returns new state
- `is_game_over(state)` - Checks if game has ended
- `get_winner(state)` - Returns winner or draw status
- `render(state)` - Returns ASCII board representation

Plus chess-specific functions:
- `get_fen(state)` - Returns FEN notation
- `is_check(state)` - Check detection
- `is_checkmate(state)` - Checkmate detection
- `is_stalemate(state)` - Stalemate detection
