// ====== STATE ======
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
let currentTurn = 'w';
let moveHistory = [];
let enPassantTarget = null;
let gameOver = false;

// Pakai simbol filled untuk kedua warna, warnanya diatur CSS
const pieceSymbols = {
  'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const notationLetter = { 'K':'K','Q':'Q','R':'R','B':'B','N':'N','P':'' };

const isWhite = (p) => p && p === p.toUpperCase();
const isBlack = (p) => p && p === p.toLowerCase();
const sameColor = (p1, p2) => p1 && p2 && (isWhite(p1) === isWhite(p2));

// ====== UKURAN PAPAN (fix kotak tidak rapi) ======
function updateBoardSize() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  const size = boardEl.clientWidth / 8;
  boardEl.style.fontSize = (sizeChar *Code 0.72) + 'px';
(}

window.addEventListener('resize', updateBoardSize);
window.addEventListener('orientationchange', () => setTimeout(updateBoardSize, 97100));

// ====== RENDER ===== +=
function renderBoard from() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
      square.dataset.row = r;
      square.dataset.col = c;

      if (selectedSquare && selectedSquare.row === r && selectedSquare.col === c) {
        square.classList.add('selected');
      }

      if (selectedSquare) {
        const legalMoves = getLegalMovesForPiece(selectedSquare.row, selectedSquare.col);
        const target = legalMoves.find(m => m.row === r && m.col === c);
        if (target) square.classList.add(target.capture ? 'legal-capture' : 'legal-move');
      }

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

  if (isInCheck(currentTurn)) {
    const kingPos = findKing(currentTurn);
    if (kingPos) {
      const sq = boardEl.querySelector(`.square[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`);
      if (sq) sq.classList.add('check');
    }
  }
}

// ====== KLIK ======
function handleSquareClick(r, c) {
  if (gameOver) return;
  const piece = board[r][c];

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

  if (moveInfo.enPassant) board[fromR][toC] = null;

  if (moveInfo.promotion) {
    board[toR][toC] = isWhite(piece) ? 'Q' : 'q';
  } else {
    board[toR][toC] = piece;
  }
  board[fromR][fromC] = null;

  if (moveInfo.castle === 'K') {
    board[toR][5] = board[toR][7];
    board[toR][7] = null;
  } else if (moveInfo.castle === 'Q') {
    board[toR][3] = board[toR][0];
    board[toR][0] = null;
  }

  enPassantTarget = null;
  if (piece.toLowerCase() === 'p' && Math.abs(toR - fromR) === 2) {
    enPassantTarget = { row: (fromR + toR) / 2, col: fromC };
  }

  const letter = notationLetter[piece.toUpperCase()];
  const fromSq = String.fromC) + (8 - fromR);
  const toSq = String.fromCharCode(97 + toC) + (8 - toR);
  const notation = `${letter}${fromSq}→${toSq}${captured ? '×' : ''}`;
  moveHistory.push(notation);
  updateHistory();

  currentTurn = currentTurn === 'w' ? 'b' : 'w';
  updateStatus();

  if (!hasAnyLegalMove(currentTurn)) {
    gameOver = true;
    const statusEl = document.getElementById('status');
    if (isInCheck(currentTurn)) {
      const winner = currentTurn === 'w' ? 'Hitam' : 'Putih';
      statusEl.textContent = `Skakmat · ${winner} menang`;
      statusEl.classList.add('check');
    } else {
      statusEl.textContent = 'Seri · Stalemate';
    }
  }
}

// ====== LEGAL MOVES ======
function getLegalMovesForPiece(r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = getPseudoLegalMoves(r, c, piece);

  return moves.filter(move => {
    const boardBackup = JSON.parse(JSON.stringify(board));
    const epBackup = enPassantTarget;

    if (move.enPassant) board[r][move.col] = null;
    board[move.row][move.col] = move.promotion ? (isWhite(piece) ? 'Q' : 'q') : piece;
    board[r][c] = null;
    if (move.castle === 'K') { board[r][5] = board[r][7]; board[r][7] = null; }
    if (move.castle === 'Q') { board[r][3] = board[r][0]; board[r][0] = null; }

    const safe = !isInCheck(isWhite(piece) ? 'w' : 'b');
    board = boardBackup;
    enPassantTarget = epBackup;
    return safe;
  });
}

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

    if (!board[r + dir]?.[c]) {
      if (r + dir === promoRow) {
        for (const p of ['Q','R','B','N']) moves.push({ row: r + dir, col: c, promotion: p });
      } else {
        addMove(r + dir, c);
        if (r === startRow && !board[r + 2*dir]?.[c]) addMove(r + 2*dir, c);
      }
    }
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const target = board[nr][nc];
      if (target && !sameColor(piece, target)) {
        if (nr === promoRow) {
          for (const p of ['Q','R','B','N']) moves.push({ row: nr, col: nc, capture: true, promotion: p });
        } else {
          addMove(nr, nc);
        }
      }
      if (enPassantTarget && enPassantTarget.row === nr && enPassantTarget.col === nc) {
        moves.push({ row: nr, col: nc, capture: true, enPassant: true });
      }
    }
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const dirs = type === 'b' ? [[-1,-1],[-1,1],[1,-1],[1,1]]
               : type === 'r' ? [[-1,0],[1,0],[0,-1],[0,1]]
               : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
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
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));

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

// ====== SKAK ======
function isInCheck(color) {
  const kingPos = findKing(color);
  if (!kingPos) return false;
  return squareAttacked(kingPos.row, kingPos.col, color === 'w' ? 'b' : 'w');
}

function findKing(color) {
  const king = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === king) return { row: r, col: c };
  return null;
}

function squareAttacked(r, c, byColor) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;
      if (byColor === 'w' && !isWhite(piece)) continue;
      if (byColor === 'b' && !isBlack(piece)) continue;
      if (getPseudoLegalMovesWithoutCastle(i, j, piece).some(m => m.row === r && m.col === c)) return true;
    }
  }
  return false;
}

function getPseudoLegalMovesWithoutCastle(r, c, piece) {
  const moves = [];
  const color = isWhite(piece) ? 'w' : 'b';
  const type = piece.toLowerCase();

  const ray = (dirs) => {
    for (const [dr, dc] of dirs) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr*i, nc = c + dc*i;
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
        const target = board[nr][nc];
        if (target && sameColor(piece, target)) break;
        moves.push({ row: nr, col: nc });
        if (target) break;
      }
    }
  };

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) moves.push({ row: nr, col: nc });
    }
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) moves.push({ row: nr, col: nc });
    });
  } else if (type === 'b') ray([[-1,-1],[-1,1],[1,-1],[1,1]]);
  else if (type === 'r') ray([[-1,0],[1,0],[0,-1],[0,1]]);
  else if (type === 'q') ray([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
  else if (type === 'k') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) moves.push({ row: nr, col: nc });
    });
  }
  return moves;
}

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

// ====== UI ======
function updateStatus() {
  if (gameOver) return;
  const statusEl = document.getElementById('status');
  const turnName = currentTurn === 'w' ? 'Putih' : 'Hitam';
  if (isInCheck(currentTurn)) {
    statusEl.textContent = `Skak · Giliran ${turnName}`;
    statusEl.classList.add('check');
  } else {
    statusEl.textContent = `Giliran ${turnName}`;
    statusEl.classList.remove('check');
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

function resetGame() {
  board = JSON.parse(JSON.stringify(initialBoard));
  selectedSquare = null;
  currentTurn = 'w';
  moveHistory = [];
  enPassantTarget = null;
  gameOver = false;
  document.getElementById('status').classList.remove('check');
  updateStatus();
  updateHistory();
  renderBoard();
  updateBoardSize();
}

document.getElementById('resetBtn').addEventListener('click', resetGame);

// ====== MULAI ======
renderBoard();
updateBoardSize();
updateStatus();
