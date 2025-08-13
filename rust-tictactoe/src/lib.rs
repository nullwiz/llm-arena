use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[derive(Serialize, Deserialize, Clone)]
struct GameState {
    board: [[i32; 3]; 3],
    current_player: String,
    move_count: u32,
    winner: String,
}

fn to_c_string(s: String) -> *mut c_char {
    CString::new(s).unwrap().into_raw()
}

fn from_c_string(ptr: *const c_char) -> String {
    unsafe {
        CStr::from_ptr(ptr).to_string_lossy().into_owned()
    }
}

#[no_mangle]
pub extern "C" fn get_initial_state() -> *mut c_char {
    let state = GameState {
        board: [[0; 3]; 3],
        current_player: "player1".to_string(),
        move_count: 0,
        winner: "".to_string(),
    };
    
    to_c_string(serde_json::to_string(&state).unwrap())
}

#[no_mangle]
pub extern "C" fn get_valid_moves(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });
    
    if !state.winner.is_empty() {
        return to_c_string("[]".to_string());
    }
    
    let mut moves = Vec::new();
    for row in 0..3 {
        for col in 0..3 {
            if state.board[row][col] == 0 {
                moves.push(format!("{},{}", row, col));
            }
        }
    }

    if moves.len() < 9 && !moves.contains(&"1,1".to_string()) && state.board[1][1] == 0 {
        eprintln!("🐛 WASM Tic-Tac-Toe Debug:");
        eprintln!("  Move count: {}", state.move_count);
        eprintln!("  Center (1,1) value: {}", state.board[1][1]);
        eprintln!("  Contains 1,1: {}", moves.contains(&"1,1".to_string()));
        eprintln!("  Moves generated: {:?}", moves);
    }

    to_c_string(serde_json::to_string(&moves).unwrap())
}

#[no_mangle]
pub extern "C" fn apply_move(state_ptr: *const c_char, move_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let move_str = from_c_string(move_ptr);
    
    let mut state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });
    
    if let Some((row_str, col_str)) = move_str.split_once(',') {
        if let (Ok(row), Ok(col)) = (row_str.parse::<usize>(), col_str.parse::<usize>()) {
            if row < 3 && col < 3 && state.board[row][col] == 0 {
                let player_mark = if state.current_player == "player1" { 1 } else { 2 };
                state.board[row][col] = player_mark;
                state.move_count += 1;
                

                state.winner = check_winner(&state.board);
                

                state.current_player = if state.current_player == "player1" { 
                    "player2".to_string() 
                } else { 
                    "player1".to_string() 
                };
            }
        }
    }
    
    to_c_string(serde_json::to_string(&state).unwrap())
}

fn check_winner(board: &[[i32; 3]; 3]) -> String {

    for row in 0..3 {
        if board[row][0] != 0 && board[row][0] == board[row][1] && board[row][1] == board[row][2] {
            return if board[row][0] == 1 { "player1".to_string() } else { "player2".to_string() };
        }
    }
    

    for col in 0..3 {
        if board[0][col] != 0 && board[0][col] == board[1][col] && board[1][col] == board[2][col] {
            return if board[0][col] == 1 { "player1".to_string() } else { "player2".to_string() };
        }
    }
    

    if board[0][0] != 0 && board[0][0] == board[1][1] && board[1][1] == board[2][2] {
        return if board[0][0] == 1 { "player1".to_string() } else { "player2".to_string() };
    }
    
    if board[0][2] != 0 && board[0][2] == board[1][1] && board[1][1] == board[2][0] {
        return if board[0][2] == 1 { "player1".to_string() } else { "player2".to_string() };
    }
    

    let mut empty_cells = 0;
    for row in 0..3 {
        for col in 0..3 {
            if board[row][col] == 0 {
                empty_cells += 1;
            }
        }
    }
    
    if empty_cells == 0 {
        "draw".to_string()
    } else {
        "".to_string()
    }
}

#[no_mangle]
pub extern "C" fn is_game_over(state_ptr: *const c_char) -> i32 {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });
    
    if !state.winner.is_empty() { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn get_winner(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });
    
    to_c_string(state.winner)
}

#[no_mangle]
pub extern "C" fn render(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });
    
    let mut output = String::new();
    output.push_str("  0   1   2\n");
    
    for row in 0..3 {
        output.push_str(&format!("{} ", row));
        for col in 0..3 {
            let cell = match state.board[row][col] {
                1 => "X",
                2 => "O",
                _ => " ",
            };
            output.push_str(&format!(" {} ", cell));
            if col < 2 {
                output.push('|');
            }
        }
        output.push_str(&format!(" {}\n", row));
        
        if row < 2 {
            output.push_str("  ---|---|---\n");
        }
    }
    
    output.push_str("  0   1   2\n");
    
    to_c_string(output)
}

#[no_mangle]
pub extern "C" fn get_game_name() -> *mut c_char {
    to_c_string("Tic-Tac-Toe".to_string())
}

#[no_mangle]
pub extern "C" fn get_current_player(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });

    let current_player = if state.move_count % 2 == 0 {
        "player1"
    } else {
        "player2"
    };

    to_c_string(current_player.to_string())
}

#[no_mangle]
pub extern "C" fn get_game_description() -> *mut c_char {
    to_c_string("Classic 3x3 tic-tac-toe game".to_string())
}

#[no_mangle]
pub extern "C" fn log_transcript(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            board: [[0; 3]; 3],
            current_player: "player1".to_string(),
            move_count: 0,
            winner: "".to_string(),
        }
    });

    let mut transcript = String::new();
    transcript.push_str(&format!("=== TIC-TAC-TOE GAME TRANSCRIPT ===\n"));
    transcript.push_str(&format!("Move count: {}\n", state.move_count));
    transcript.push_str(&format!("Current player: {}\n", state.current_player));
    transcript.push_str(&format!("Winner: {}\n", if state.winner.is_empty() { "None" } else { &state.winner }));

    transcript.push_str("Board state:\n");
    for row in 0..3 {
        transcript.push_str("  ");
        for col in 0..3 {
            let symbol = match state.board[row][col] {
                1 => "X",
                2 => "O",
                _ => "."
            };
            transcript.push_str(&format!("{} ", symbol));
        }
        transcript.push_str("\n");
    }

    let mut valid_moves = Vec::new();
    for row in 0..3 {
        for col in 0..3 {
            if state.board[row][col] == 0 {
                valid_moves.push(format!("{},{}", row, col));
            }
        }
    }

    transcript.push_str(&format!("Valid moves ({}): {:?}\n", valid_moves.len(), valid_moves));
    transcript.push_str("===================================\n");

    to_c_string(transcript)
}
