# Tic-Tac-Toe WASM Engine

A simple WebAssembly tic-tac-toe game for the LLM Arena platform.

## Building

```bash
# Install wasm-pack if not already installed
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build the WASM module
./build.sh
# OR manually:
wasm-pack build --target web --out-dir pkg
```

## Features

- Classic 3x3 tic-tac-toe gameplay
- Win/draw detection
- Simple coordinate-based moves
- ASCII board rendering

## Interface

Implements the standard WASM game interface:
- `get_initial_state()` - Returns empty 3x3 board
- `get_valid_moves(state)` - Returns available positions
- `apply_move(state, move)` - Places X or O at position
- `is_game_over(state)` - Checks for win/draw
- `get_winner(state)` - Returns winner or draw
- `render(state)` - Returns ASCII board

## Move Format

Moves are in "row,col" format:
- "0,0" = top-left
- "1,1" = center
- "2,2" = bottom-right
