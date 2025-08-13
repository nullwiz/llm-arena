# LLM Arena 

A fully static React + TypeScript app for evaluating AI agents against turn‑based games. 
I made it because I wanted to see LLMs battle each other. Turns out they suck.
Also made two games: chess and tic-tac toe. This should work wth OpenAI, Anthropic, Ollama, or 
your custom LLM. I only tested Deepsek and Anthropic.

Main idea is: you implement the interface, and if it satisfies the interface, it should work.
You should provide the prompts for the LLM aswell. See the metadata.json files on public 
folder for examples. 

## 🚀 Quick Start

## 🧩 Implementing a turn based game

This loads user‑provided WebAssembly games that implement a minimal standard interface. 

Required exports (C/wasm-bindgen style names shown as snake_case):
- get_initial_state() -> char*  // JSON string of initial game state
- get_valid_moves() -> char*    // JSON array of strings
- apply_move(move_ptr: char*) -> char*
- is_game_over() -> i32         // 1 or 0
- get_winner() -> char*         // "player1" | "player2" | "draw"
- render() -> char*             // optional pretty render string

Optional exports:
- get_game_name() -> char*
- get_current_player() -> char*
- get_game_description() -> char*
- get_move_notation(move_ptr: char*) -> char*

JSON formats:
- State: free‑form per game, but must be a valid JSON string. Example:
  {"board":"...","current_player":"player1","move_count":0}
- Moves: array of strings. Example: ["e2e4","g1f3"] or ["up","down","left","right"].
- Winner: one of "player1", "player2", "draw", or empty/null while in‑progress.

Minimal metadata (supplied alongside WASM at upload time):
- name: string (required)
- Optional: description, gameType, tags, author, version, difficulty, aiPrompts

### Steps to create a compatible WASM game (Rust example)
1) Define your game logic and implement the exports above.
2) Each exported function returns a pointer to a null‑terminated UTF‑8 string allocated in WASM memory.
3) Provide a way to read input strings (e.g., apply_move receives a pointer to a C string).
4) Build using wasm-pack with target web.

Example (very abbreviated Rust):
```
#[no_mangle]
pub extern "C" fn get_initial_state() -> *mut c_char { c_string("{\"current_player\":\"player1\"}") }
#[no_mangle]
pub extern "C" fn get_valid_moves() -> *mut c_char { c_string("[\"a\",\"b\"]") }
#[no_mangle]
pub extern "C" fn apply_move(ptr: *const c_char) -> *mut c_char { /* update state */ c_string("{...}") }
#[no_mangle]
pub extern "C" fn is_game_over() -> i32 { 0 }
#[no_mangle]
pub extern "C" fn get_winner() -> *mut c_char { c_string("") }
#[no_mangle]
pub extern "C" fn render() -> *mut c_char { c_string("ASCII board text") }
```

### Integrate 
- Open the app → Upload WASM
- Select your .wasm file and optional metadata.json
- The app validates exports, loads the engine, and persists it in localStorage
- Start a match from Game Selection

Troubleshooting:
- If validation fails, ensure the required exports exist and memory is exported
- Make sure all returned strings are null‑terminated and valid UTF‑8
- Keep JSON outputs small to avoid memory issues; prefer concise encodings

### Option 1: Use the Hosted Version
Visit the live application at: `https://nullwiz.github.io/llm-arena/`

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/nullwiz/llm-arena.git
cd llm-arena

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Setup Guide

### 1. Get API Keys
To use AI opponents, you'll need API keys from:

**OpenAI (GPT models)**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and add billing information
3. Generate a new API key

**Anthropic (Claude models)**
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and add billing information
3. Generate a new API key

### 2. To add your key
1. Click "Settings" in the top navigation
2. Go to "AI Models" tab
3. Click "Add Configuration"
4. Enter your API key and select a model
5. Save the configuration

### 3. Start Playing
1. Return to the main page
2. Select a game (Tic-Tac-Toe or Connect Four)
3. Choose player types for Player 1 and Player 2
4. Click "Start Game"

## 🎯 Game Modes

### Player vs AI
- Human player vs LLM agent
- Human player vs Rule-based AI
- Perfect for testing strategies against different AI types

### AI vs AI
- LLM agent vs LLM agent (watch AIs battle each other)
- LLM agent vs Rule-based AI
- Great for observing AI behavior and strategies

### Local Multiplayer
- Human vs Human
- Take turns on the same device

### Single Player
- Human vs Empty slot
- Practice mode or puzzle solving

## Disclaimer

Models are pretty stupid when it comes to turn-based games. You might waste some tokens.
