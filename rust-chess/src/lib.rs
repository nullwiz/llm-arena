use chess::{Board, ChessMove, Color, Game, MoveGen, Piece, Square};
use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct GameState {
    fen: String,
    moves: Vec<String>,
    current_player: String,
    move_count: u32,
}

static mut GAME: Option<Game> = None;

unsafe fn get_game() -> &'static mut Game {
    if GAME.is_none() {
        GAME = Some(Game::new());
    }
    GAME.as_mut().unwrap()
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
    let board = Board::default();
    let state = GameState {
        fen: board.to_string(),
        moves: Vec::new(),
        current_player: "player1".to_string(),
        move_count: 0,
    };
    
    unsafe {
        *get_game() = Game::new();
    }
    
    to_c_string(serde_json::to_string(&state).unwrap())
}

#[no_mangle]
pub extern "C" fn get_valid_moves(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });

    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    let mut moves = Vec::new();

    for chess_move in MoveGen::new_legal(&board) {
        moves.push(chess_move.to_string());
    }
    if moves.len() < 30 && !moves.contains(&"e2e4".to_string()) {
        eprintln!("🐛 WASM Chess Debug:");
        eprintln!("  FEN: {}", state.fen);
        eprintln!("  Move count: {}", state.move_count);
        eprintln!("  Moves generated: {}", moves.len());
        eprintln!("  Contains e2e4: {}", moves.contains(&"e2e4".to_string()));
        eprintln!("  First 10 moves: {:?}", &moves[..moves.len().min(10)]);
    }

    to_c_string(serde_json::to_string(&moves).unwrap())
}

#[no_mangle]
pub extern "C" fn apply_move(state_ptr: *const c_char, move_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let move_str = from_c_string(move_ptr);
    
    let mut state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    
    if let Ok(chess_move) = ChessMove::from_str(&move_str) {
        if board.legal(chess_move) {
            let new_board = board.make_move_new(chess_move);
            state.fen = new_board.to_string();
            state.moves.push(move_str);
            state.move_count += 1;
            state.current_player = if state.current_player == "player1" { 
                "player2".to_string() 
            } else { 
                "player1".to_string() 
            };
        }
    }
    
    to_c_string(serde_json::to_string(&state).unwrap())
}

#[no_mangle]
pub extern "C" fn is_game_over(state_ptr: *const c_char) -> i32 {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    
    if board.status() != chess::BoardStatus::Ongoing {
        1
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn get_winner(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    
    let winner = match board.status() {
        chess::BoardStatus::Checkmate => {
            if board.side_to_move() == Color::White {
                "player2"
            } else {
                "player1"
            }
        },
        chess::BoardStatus::Stalemate => "draw",
        _ => ""
    };
    
    to_c_string(winner.to_string())
}

#[no_mangle]
pub extern "C" fn render(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    
    let mut output = String::new();
    output.push_str("  a b c d e f g h\n");
    
    for rank in (0..8).rev() {
        output.push_str(&format!("{} ", rank + 1));
        for file in 0..8 {
            let square = Square::make_square(chess::Rank::from_index(rank), chess::File::from_index(file));
            let piece = board.piece_on(square);
            let piece_char = match piece {
                Some(piece) => {
                    let color = board.color_on(square).unwrap();
                    let symbol = match piece {
                        Piece::Pawn => "P",
                        Piece::Rook => "R",
                        Piece::Knight => "N",
                        Piece::Bishop => "B",
                        Piece::Queen => "Q",
                        Piece::King => "K",
                    };
                    if color == Color::White {
                        symbol
                    } else {
                        match piece {
                            Piece::Pawn => "p",
                            Piece::Rook => "r",
                            Piece::Knight => "n",
                            Piece::Bishop => "b",
                            Piece::Queen => "q",
                            Piece::King => "k",
                        }
                    }
                },
                None => "."
            };
            output.push_str(&format!("{} ", piece_char));
        }
        output.push_str(&format!(" {}\n", rank + 1));
    }
    output.push_str("  a b c d e f g h\n");
    
    to_c_string(output)
}

#[no_mangle]
pub extern "C" fn get_game_name() -> *mut c_char {
    to_c_string("Chess".to_string())
}

#[no_mangle]
pub extern "C" fn get_current_player(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });


    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    let current_player = if board.side_to_move() == Color::White {
        "player1"
    } else {
        "player2"
    };

    to_c_string(current_player.to_string())
}

#[no_mangle]
pub extern "C" fn get_game_description() -> *mut c_char {
    to_c_string("Classic chess game with full rules".to_string())
}

#[no_mangle]
pub extern "C" fn get_fen(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    to_c_string(state.fen)
}

#[no_mangle]
pub extern "C" fn is_check(state_ptr: *const c_char) -> i32 {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    if board.checkers().popcnt() > 0 { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn is_checkmate(state_ptr: *const c_char) -> i32 {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    if board.status() == chess::BoardStatus::Checkmate { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn is_stalemate(state_ptr: *const c_char) -> i32 {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });
    
    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    if board.status() == chess::BoardStatus::Stalemate { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn get_move_uci(move_ptr: *const c_char) -> *mut c_char {
    let move_str = from_c_string(move_ptr);
    to_c_string(move_str)
}

#[no_mangle]
pub extern "C" fn log_transcript(state_ptr: *const c_char) -> *mut c_char {
    let state_str = from_c_string(state_ptr);
    let state: GameState = serde_json::from_str(&state_str).unwrap_or_else(|_| {
        GameState {
            fen: Board::default().to_string(),
            moves: Vec::new(),
            current_player: "player1".to_string(),
            move_count: 0,
        }
    });

    let mut transcript = String::new();
    transcript.push_str(&format!("=== CHESS GAME TRANSCRIPT ===\n"));
    transcript.push_str(&format!("Move count: {}\n", state.move_count));
    transcript.push_str(&format!("Current FEN: {}\n", state.fen));
    transcript.push_str(&format!("Current player: {}\n", state.current_player));
    transcript.push_str(&format!("Moves played:\n"));

    for (i, move_str) in state.moves.iter().enumerate() {
        transcript.push_str(&format!("  {}. {}\n", i + 1, move_str));
    }

    let board = Board::from_str(&state.fen).unwrap_or(Board::default());
    let valid_moves: Vec<String> = MoveGen::new_legal(&board)
        .map(|m| m.to_string())
        .collect();

    transcript.push_str(&format!("Valid moves ({}):\n", valid_moves.len()));
    for (i, move_str) in valid_moves.iter().enumerate() {
        if i % 8 == 0 { transcript.push_str("  "); }
        transcript.push_str(&format!("{:6}", move_str));
        if (i + 1) % 8 == 0 { transcript.push_str("\n"); }
    }
    if valid_moves.len() % 8 != 0 { transcript.push_str("\n"); }

    transcript.push_str("==============================\n");

    to_c_string(transcript)
}
