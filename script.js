// --- Sélecteurs ---
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const resetScoresBtn = document.getElementById('resetScores');
const modeButtons = document.querySelectorAll('#mode button[data-mode]');
const sizeButtons = document.querySelectorAll('#mode button[data-size]');
const boardContainer = document.querySelector('.board');

// --- Scores ---
let scoreX = 0, scoreO = 0, scoreDraw = 0;
const scoreXText = document.getElementById('scoreX');
const scoreOText = document.getElementById('scoreO');
const scoreDrawText = document.getElementById('scoreDraw');

// --- Jeu ---
let currentPlayer = 'X';
let board = [];
let gameActive = true;
let gameMode = "pvp"; // pvp, easy, medium, hard
let gridSize = 3;

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

// --- Générer les combinaisons gagnantes dynamiquement ---
function generateWinningCombos(size) {
  let combos = [];

  // Lignes
  for (let r = 0; r < size; r++) {
    combos.push([...Array(size).keys()].map(c => r * size + c));
  }

  // Colonnes
  for (let c = 0; c < size; c++) {
    combos.push([...Array(size).keys()].map(r => r * size + c));
  }

  // Diagonale principale
  combos.push([...Array(size).keys()].map(i => i * size + i));

  // Diagonale secondaire
  combos.push([...Array(size).keys()].map(i => i * size + (size - 1 - i)));

  return combos;
}

let winningCombos = generateWinningCombos(gridSize);

// --- Créer la grille ---
function createBoard(size) {
  gridSize = size;
  board = Array(size * size).fill("");
  winningCombos = generateWinningCombos(size);

  boardContainer.innerHTML = "";
  boardContainer.style.gridTemplateColumns = `repeat(${size}, 110px)`;
  boardContainer.style.gridTemplateRows = `repeat(${size}, 110px)`;

  for (let i = 0; i < size * size; i++) {
    let cell = document.createElement("div");
    cell.classList.add("cell");
    cell.setAttribute("data-index", i);
    cell.addEventListener("click", handleCellClick);
    boardContainer.appendChild(cell);
  }

  resetGame();
}

// --- Vérifier victoire ---
function checkWin() {
  return winningCombos.some(combo =>
    combo.every(i => board[i] !== "" && board[i] === board[combo[0]])
  );
}

// --- IA FACILE ---
function aiEasy() {
  let empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  if (empty.length === 0) return;
  playMove(empty[Math.floor(Math.random() * empty.length)], "O");
}

// --- IA NORMAL ---
function aiMedium() {
  // 1. IA peut gagner
  for (let combo of winningCombos) {
    let vals = combo.map(i => board[i]);
    if (vals.filter(v => v === "O").length === gridSize - 1 && vals.includes("")) {
      return playMove(combo[vals.indexOf("")], "O");
    }
  }

  // 2. Joueur peut gagner → IA bloque
  for (let combo of winningCombos) {
    let vals = combo.map(i => board[i]);
    if (vals.filter(v => v === "X").length === gridSize - 1 && vals.includes("")) {
      return playMove(combo[vals.indexOf("")], "O");
    }
  }

  // 3. Sinon random
  aiEasy();
}

// --- IA IMPOSSIBLE (seulement en 3x3) ---
function minimax(newBoard, player) {
  let empty = newBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);

  if (checkWinner(newBoard, "X")) return { score: -10 };
  if (checkWinner(newBoard, "O")) return { score: 10 };
  if (empty.length === 0) return { score: 0 };

  let moves = [];

  for (let i of empty) {
    let move = { index: i };
    newBoard[i] = player;

    move.score = minimax(newBoard, player === "O" ? "X" : "O").score;

    newBoard[i] = "";
    moves.push(move);
  }

  if (player === "O") {
    return moves.reduce((a, b) => (a.score > b.score ? a : b));
  } else {
    return moves.reduce((a, b) => (a.score < b.score ? a : b));
  }
}

function checkWinner(b, p) {
  return winningCombos.some(combo => combo.every(i => b[i] === p));
}

function aiHard() {
  // On limite Minimax au 3x3 pour éviter les crashs
  if (gridSize !== 3) {
    aiMedium();
    return;
  }
  let best = minimax([...board], "O");
  playMove(best.index, "O");
}

// --- Jouer un coup ---
function playMove(index, player) {
  if (!gameActive || board[index] !== "") return;

  board[index] = player;
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  cell.textContent = player;
  cell.classList.add("disabled");

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

  // Tour de l'IA si on n'est pas en JvJ
  if (currentPlayer === "O" && gameMode !== "pvp") {
    setTimeout(() => {
      if (!gameActive) return;
      if (gameMode === "easy") aiEasy();
      else if (gameMode === "medium") aiMedium();
      else if (gameMode === "hard") aiHard();
    }, 300);
  }
}

// --- Clic joueur ---
function handleCellClick(e) {
  const index = e.target.getAttribute("data-index");
  if (!gameActive || board[index] !== "") return;

  if (gameMode === "pvp") {
    // En JvJ, on joue avec currentPlayer (X puis O)
    playMove(index, currentPlayer);
  } else {
    // En mode IA, le joueur humain est toujours X
    if (currentPlayer !== "X") return;
    playMove(index, "X");
  }
}

// --- Reset partie ---
function resetGame() {
  board = Array(gridSize * gridSize).fill("");
  gameActive = true;
  currentPlayer = "X";
  statusText.textContent = "Tour du joueur X";

  document.querySelectorAll('.cell').forEach(c => {
    c.textContent = "";
    c.classList.remove("disabled");
  });
}

// --- Reset scores ---
function resetScores() {
  scoreX = scoreO = scoreDraw = 0;
  scoreXText.textContent = scoreOText.textContent = scoreDrawText.textContent = 0;
  localStorage.clear();
}

// --- Boutons de mode ---
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    gameMode = btn.dataset.mode;
    resetGame();
  });
});

// --- Boutons de taille ---
sizeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sizeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    createBoard(parseInt(btn.dataset.size));
  });
});

// --- Init ---
createBoard(3);
loadScores();
resetBtn.addEventListener('click', resetGame);
resetScoresBtn.addEventListener('click', resetScores);

