// --- Sélecteurs ---
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const resetScoresBtn = document.getElementById('resetScores');
const modeButtons = document.querySelectorAll('#mode button');

// --- Scores ---
let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

const scoreXText = document.getElementById('scoreX');
const scoreOText = document.getElementById('scoreO');
const scoreDrawText = document.getElementById('scoreDraw');

// --- Jeu ---
let currentPlayer = 'X';
let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
let gameMode = "pvp"; // pvp, easy, medium, hard

// --- Combinaisons gagnantes ---
const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

// --- Charger les scores ---
function loadScores() {
  scoreX = parseInt(localStorage.getItem("scoreX")) || 0;
  scoreO = parseInt(localStorage.getItem("scoreO")) || 0;
  scoreDraw = parseInt(localStorage.getItem("scoreDraw")) || 0;

  scoreXText.textContent = scoreX;
  scoreOText.textContent = scoreO;
  scoreDrawText.textContent = scoreDraw;
}

// --- Sauvegarder les scores ---
function saveScores() {
  localStorage.setItem("scoreX", scoreX);
  localStorage.setItem("scoreO", scoreO);
  localStorage.setItem("scoreDraw", scoreDraw);
}

// --- Vérifier victoire ---
function checkWin() {
  return winningCombos.some(combo => {
    const [a, b, c] = combo;
    return board[a] !== "" && board[a] === board[b] && board[a] === board[c];
  });
}

// --- IA FACILE (random) ---
function aiEasy() {
  let emptyCells = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  let randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  playMove(randomIndex, "O");
}

// --- IA NORMAL ---
function aiMedium() {
  // 1. Si IA peut gagner → elle joue
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    let line = [board[a], board[b], board[c]];
    if (line.filter(v => v === "O").length === 2 && line.includes("")) {
      return playMove(combo[line.indexOf("")], "O");
    }
  }

  // 2. Si joueur peut gagner → IA bloque
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    let line = [board[a], board[b], board[c]];
    if (line.filter(v => v === "X").length === 2 && line.includes("")) {
      return playMove(combo[line.indexOf("")], "O");
    }
  }

  // 3. Sinon → random
  aiEasy();
}

// --- IA IMPOSSIBLE (MINIMAX) ---
function minimax(newBoard, player) {
  const availSpots = newBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);

  if (checkWinner(newBoard, "X")) return { score: -10 };
  if (checkWinner(newBoard, "O")) return { score: 10 };
  if (availSpots.length === 0) return { score: 0 };

  let moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    let move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === "O") {
      let result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      let result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[availSpots[i]] = "";
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -10000;
    moves.forEach((m, i) => {
      if (m.score > bestScore) {
        bestScore = m.score;
        bestMove = i;
      }
    });
  } else {
    let bestScore = 10000;
    moves.forEach((m, i) => {
      if (m.score < bestScore) {
        bestScore = m.score;
        bestMove = i;
      }
    });
  }

  return moves[bestMove];
}

function checkWinner(b, p) {
  return winningCombos.some(([a, b2, c]) => b[a] === p && b[b2] === p && b[c] === p);
}

function aiHard() {
  let best = minimax([...board], "O");
  playMove(best.index, "O");
}

// --- Jouer un coup ---
function playMove(index, player) {
  if (board[index] !== "" || !gameActive) return;

  board[index] = player;
  cells[index].textContent = player;
  cells[index].classList.add("disabled");

  if (checkWin()) {
    statusText.textContent = `Le joueur ${player} a gagné !`;
    gameActive = false;

    if (player === "X") scoreX++;
    else scoreO++;

    scoreXText.textContent = scoreX;
    scoreOText.textContent = scoreO;
    saveScores();
    return;
  }

  if (board.every(v => v !== "")) {
    statusText.textContent = "Match nul !";
    gameActive = false;
    scoreDraw++;
    scoreDrawText.textContent = scoreDraw;
    saveScores();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusText.textContent = `Tour du joueur ${currentPlayer}`;

  // IA joue automatiquement
  if (currentPlayer === "O" && gameActive) {
    setTimeout(() => {
      if (gameMode === "easy") aiEasy();
      else if (gameMode === "medium") aiMedium();
      else if (gameMode === "hard") aiHard();
    }, 300);
  }
}

// --- Clic joueur ---
function handleCellClick(e) {
  if (currentPlayer === "O" && gameMode !== "pvp") return;
  playMove(e.target.getAttribute("data-index"), "X");
}

// --- Reset partie ---
function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  gameActive = true;
  currentPlayer = "X";
  statusText.textContent = "Tour du joueur X";

  cells.forEach(c => {
    c.textContent = "";
    c.classList.remove("disabled");
  });
}

// --- Reset scores ---
function resetScores() {
  scoreX = 0;
  scoreO = 0;
  scoreDraw = 0;

  scoreXText.textContent = 0;
  scoreOText.textContent = 0;
  scoreDrawText.textContent = 0;

  localStorage.clear();
}

// --- Changer de mode ---
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    gameMode = btn.dataset.mode;
    resetGame();
  });
});

// --- Init ---
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
resetScoresBtn.addEventListener('click', resetScores);
loadScores();
