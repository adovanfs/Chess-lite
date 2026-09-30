// ====== STATE PERMAINAN ======
const initialBoard = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

let board = JSON.parse(JSON.stringify(initialBoard));
let selectedSquare = null;
let currentTurn = 'w'; // 'w' putih, 'b' hitam
let moveHistory = [];
let enPassantTarget = null; // untuk en passant
let gameOver = false;

// Simbol Unicode untuk bidak
const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

// Cek warna bidak (huruf besar = putih, kecil = hitam)
const isWhite = (p) => p && p === p.toUpperCase();
const isBlack = (p) => p && p === p.toLowerCase();
const sameColor = (p1, p2) => p1 && p2 && (isWhite(p1) === isWhite(p2));

// ====== RENDER PAPAN ======
function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
      square.dataset.row = r;
      square.dataset.col = c;
      
      // Highlight kotak terpilih
      if (selectedSquare && selectedSquare.row === r && selectedSquare.col === c) {
        square.classList.add('selected');
      }
      
      // Highlight langkah legal
      if (selectedSquare) {
        const legalMoves = getLegalMovesForPiece(selectedSquare.row, selectedSquare.col);
        const target = legalMoves.find(m => m.row === r && m.col === c);
        if (target) {
          square.classList.add(target.capture ? 'legal-capture' : 'legal-move');
        }
      }
      
      // Tampilkan bidak
      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement('span');
        pieceEl.className = `piece ${isWhite(piece) ? 'w' : 'b'}`;
        pieceEl.textContent = pieceSymbols[piece];
        square.appendChild(pieceEl);
      }
      
      square.addEventListener('click', () => handleSquareClick(r, c));
      boardEl.appendChild(square);
    }
  }
  
  // Highlight raja yang di-skak
  if (isInCheck(currentTurn)) {
    const kingPos = findKing(currentTurn);
    if (kingPos) {
      const kingSquare = document.querySelector(`.square[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`);
      if (kingSquare) kingSquare.classList.add('check');
    }
  }
}

// ====== KLIK KOTAK ======
function handleSquareClick(r, c) {
  if (gameOver) return;
  
  const piece = board[r][c];
  
  // Kalau ada bidak terpilih sebelumnya
  if (selectedSquare) {
    const legalMoves = getLegalMovesForPiece(selectedSquare.row, selectedSquare.col);
    const target = legalMoves.find(m => m.row === r && m.col === c);
    
    if (target) {
      makeMove(selectedSquare.row, selectedSquare.col, r, c, target);
      selectedSquare = null;
      renderBoard();
      return;
    }
  }
  
  // Pilih bidak baru
  if (piece && ((currentTurn === 'w' && isWhite(piece)) || (currentTurn === 'b' && isBlack(piece)))) {
    selectedSquare = { row: r, col: c };
  } else {
    selectedSquare = null;
  }
  
  renderBoard();
}

// ====== EKSEKUSI LANGKAH ======
function makeMove(fromR, fromC, toR, toC, moveInfo) {
  const piece = board[fromR][fromC];
  const captured = board[toR][toC];
  
  // En passant capture
  if (moveInfo.enPassant) {
    board[fromR][toC] = null;
  }
  
  // Promosi pion
  if (moveInfo.promotion) {
    board[toR][toC] = isWhite(piece) ? 'Q' : 'q';
  } else {
    board[toR][toC] = piece;
  }
  board[fromR][fromC] = null;
  
  // Castling: pindahkan rook
  if (moveInfo.castle) {
    if (moveInfo.castle === 'K') {
      board[toR][5] = board[toR][7];
      board[toR][7] = null;
    } else if (moveInfo.castle === 'Q') {
      board[toR][3] = board[toR][0];
      board[toR][0] = null;
    }
  }
  
  // Set target en passant untuk langkah berikutnya
  enPassantTarget = null;
  if (piece.toLowerCase() === 'p' && Math.abs(toR - fromR) === 2) {
    enPassantTarget = { row: (fromR + toR) / 2, col: fromC };
  }
  
  // Catat riwayat
  const notation = `${pieceSymbols[piece]} ${String.fromCharCode(97 + fromC)}${8 - fromR}→${String.fromCharCode(97 + toC)}${8 - toR}`;
  moveHistory.push(notation);
  updateHistory();
  
  // Ganti giliran
  currentTurn = currentTurn === 'w' ? 'b' : 'w';
  updateStatus();
  
  // Cek skakmat / stalemate
  if (!hasAnyLegalMove(currentTurn)) {
    if (isInCheck(currentTurn)) {
      gameOver = true;
      const winner = currentTurn === 'w' ? 'Hitam' : 'Putih';
      document.getElementById('status').textContent = `🏆 SKAKMAT! ${winner} menang!`;
    } else {
      gameOver = true;
      document.getElementById('status').textContent = `🤝 Seri (Stalemate)`;
    }
  }
}

// ====== SEMUA LANGKAH LEGAL UNTUK SEBUAH BIDAK ======
function getLegalMovesForPiece(r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  
  const moves = getPseudoLegalMoves(r, c, piece);
  
  // Filter: hanya langkah yang tidak meninggalkan raja sendiri dalam skak
  return moves.filter(move => {
    const boardBackup = JSON.parse(JSON.stringify(board));
    const epBackup = enPassantTarget;
    
    // Simulasi langkah
    const captured = board[move.row][move.col];
    if (move.enPassant) board[r][move.col] = null;
    board[move.row][move.col] = move.promotion ? (isWhite(piece) ? 'Q' : 'q') : piece;
    board[r][c] = null;
    if (move.castle === 'K') { board[r][5] = board[r][7]; board[r][7] = null; }
    if (move.castle === 'Q') { board[r][3] = board[r][0]; board[r][0] = null; }
    
    const safe = !isInCheck(isWhite(piece) ? 'w' : 'b');
    
    // Balikin
    board = boardBackup;
    enPassantTarget = epBackup;
    
    return safe;
  });
}

// ====== LANGKAH PSEUDO-LEGAL (belum cek skak) ======
function getPseudoLegalMoves(r, c, piece) {
  const moves = [];
  const color = isWhite(piece) ? 'w' : 'b';
  const type = piece.toLowerCase();
  
  const addMove = (nr, nc, extra = {}) => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return;
    const target = board[nr][nc];
    if (target && sameColor(piece, target)) return;
    moves.push({ row: nr, col: nc, capture: !!target || extra.enPassant, ...extra });
  };
  
  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;
    
    // Maju 1
    if (!board[r + dir]?.[c]) {
      if (r + dir === promoRow) {
        for (const p of ['Q', 'R', 'B', 'N']) {
          moves.push({ row: r + dir, col: c, promotion: p });
        }
      } else {
        addMove(r + dir, c);
      }
      // Maju 2 dari posisi awal
      if (r === startRow && !board[r + 2*dir]?.[c]) {
        addMove(r + 2*dir, c);
      }
    }
    // Makan diagonal
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const target = board[nr][nc];
      if (target && !sameColor(piece, target)) {
        if (nr === promoRow) {
          for (const p of ['Q', 'R', 'B', 'N']) {
            moves.push({ row: nr, col: nc, capture: true, promotion: p });
          }
        } else {
          addMove(nr, nc);
        }
      }
      // En passant
      if (enPassantTarget && enPassantTarget.row === nr && enPassantTarget.col === nc) {
        moves.push({ row: nr, col: nc, capture: true, enPassant: true });
      }
    }
  } else if (type === 'n') {
    const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    jumps.forEach(([dr, dc]) => addMove(r + dr, c + dc));
  } else if (type === 'b') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr*i, nc = c + dc*i;
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
        const target = board[nr][nc];
        if (target) {
          if (!sameColor(piece, target)) moves.push({ row: nr, col: nc, capture: true });
          break;
        }
        moves.push({ row: nr, col: nc, capture: false });
      }
    }
  } else if (type === 'r') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr*i, nc = c + dc*i;
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
        const target = board[nr][nc];
        if (target) {
          if (!sameColor(piece, target)) moves.push({ row: nr, col: nc, capture: true });
          break;
        }
        moves.push({ row: nr, col: nc, capture: false });
      }
    }
  } else if (type === 'q') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr*i, nc = c + dc*i;
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
        const target = board[nr][nc];
        if (target) {
          if (!sameColor(piece, target)) moves.push({ row: nr, col: nc, capture: true });
          break;
        }
        moves.push({ row: nr, col: nc, capture: false });
      }
    }
  } else if (type === 'k') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      addMove(r + dr, c + dc);
    }
    // Castling
    if (color === 'w' && r === 7 && c === 4) {
      if (board[7][5] === null && board[7][6] === null && board[7][7] === 'R' &&
          !isInCheck('w') && !squareAttacked(7, 5, 'b') && !squareAttacked(7, 6, 'b')) {
        moves.push({ row: 7, col: 6, castle: 'K' });
      }
      if (board[7][3] === null && board[7][2] === null && board[7][1] === null && board[7][0] === 'R' &&
          !isInCheck('w') && !squareAttacked(7, 3, 'b') && !squareAttacked(7, 2, 'b')) {
        moves.push({ row: 7, col: 2, castle: 'Q' });
      }
    }
    if (color === 'b' && r === 0 && c === 4) {
      if (board[0][5] === null && board[0][6] === null && board[0][7] === 'r' &&
          !isInCheck('b') && !squareAttacked(0, 5, 'w') && !squareAttacked(0, 6, 'w')) {
        moves.push({ row: 0, col: 6, castle: 'K' });
      }
      if (board[0][3] === null && board[0][2] === null && board[0][1] === null && board[0][0] === 'r' &&
          !isInCheck('b') && !squareAttacked(0, 3, 'w') && !squareAttacked(0, 2, 'w')) {
        moves.push({ row: 0, col: 2, castle: 'Q' });
      }
    }
  }
  
  return moves;
}

// ====== CEK SKAK ======
function isInCheck(color) {
  const kingPos = findKing(color);
  if (!kingPos) return false;
  return squareAttacked(kingPos.row, kingPos.col, color === 'w' ? 'b' : 'w');
}

function findKing(color) {
  const king = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) return { row: r, col: c };
    }
  }
  return null;
}

// Cek apakah kotak diserang oleh warna tertentu
function squareAttacked(r, c, byColor) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;
      if (byColor === 'w' && !isWhite(piece)) continue;
      if (byColor === 'b' && !isBlack(piece)) continue;
      
      const pseudoMoves = getPseudoLegalMovesWithoutCastle(i, j, piece);
      if (pseudoMoves.some(m => m.row === r && m.col === c)) return true;
    }
  }
  return false;
}

// Versi tanpa castling (untuk cek serangan, hindari infinite loop)
function getPseudoLegalMovesWithoutCastle(r, c, piece) {
  const moves = [];
  const color = isWhite(piece) ? 'w' : 'b';
  const type = piece.toLowerCase();
  
  const addMove = (nr, nc) => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
    const target = board[nr][nc];
    if (target && sameColor(piece, target)) return false;
    moves.push({ row: nr, col: nc });
    return !target;
  };
  
  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) moves.push({ row: nr, col: nc });
    });
  } else if (type === 'b') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      for (let i = 1; i < 8; i++) {
        if (!addMove(r + dr*i, c + dc*i)) break;
      }
    }
  } else if (type === 'r') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i < 8; i++) {
        if (!addMove(r + dr*i, c + dc*i)) break;
      }
    }
  } else if (type === 'q') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i < 8; i++) {
        if (!addMove(r + dr*i, c + dc*i)) break;
      }
    }
  } else if (type === 'k') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

// ====== CEK APAKAH PEMAIN PUNYA LANGKAH LEGAL ======
function hasAnyLegalMove(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (color === 'w' && !isWhite(piece)) continue;
      if (color === 'b' && !isBlack(piece)) continue;
      if (getLegalMovesForPiece(r, c).length > 0) return true;
    }
  }
  return false;
}

// ====== UPDATE UI ======
function updateStatus() {
  if (gameOver) return;
  const statusEl = document.getElementById('status');
  const turnName = currentTurn === 'w' ? 'Putih' : 'Hitam';
  if (isInCheck(currentTurn)) {
    statusEl.textContent = `⚠️ SKAK! Giliran: ${turnName}`;
  } else {
    statusEl.textContent = `Giliran: ${turnName}`;
  }
}

function updateHistory() {
  const el = document.getElementById('moveHistory');
  el.innerHTML = '';
  moveHistory.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m;
    el.appendChild(li);
  });
}

// ====== RESET ======
function resetGame() {
  board = JSON.parse(JSON.stringify(initialBoard));
  selectedSquare = null;
  currentTurn = 'w';
  moveHistory = [];
  enPassantTarget = null;
  gameOver = false;
  updateStatus();
  updateHistory();
  renderBoard();
}

document.getElementById('resetBtn').addEventListener('click', resetGame);

// ====== MULAI ======
renderBoard();
updateStatus();
