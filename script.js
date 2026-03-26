const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const resetScoresBtn = document.getElementById('resetScores');

// --- Scores ---
let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

const scoreXText = document.getElementById('scoreX');
const scoreOText = document.getElementById('scoreO');
const scoreDrawText = document.getElementById('scoreDraw');

// --- Charger les scores sauvegardés ---
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

// --- Jeu ---
let currentPlayer = 'X';
let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;

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

function handleCellClick(e) {
  const cell = e.target;
  const index = cell.getAttribute('data-index');

  if (!gameActive || board[index] !== "") {
    return;
  }

  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add('disabled');

  if (checkWin()) {
    statusText.textContent = `Le joueur ${currentPlayer} a gagné !`;
    gameActive = false;

    if (currentPlayer === "X") {
      scoreX++;
      scoreXText.textContent = scoreX;
    } else {
      scoreO++;
      scoreOText.textContent = scoreO;
    }

    saveScores();
    return;
  }

  if (board.every(cell => cell !== "")) {
    statusText.textContent = "Match nul !";
    gameActive = false;

    scoreDraw++;
    scoreDrawText.textContent = scoreDraw;

    saveScores();
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusText.textContent = `Tour du joueur ${currentPlayer}`;
}

function checkWin() {
  return winningCombos.some(combo => {
    const [a, b, c] = combo;
    return (
      board[a] !== "" &&
      board[a] === board[b] &&
      board[a] === board[c]
    );
  });
}

function resetGame() {
  currentPlayer = 'X';
  board = ["", "", "", "", "", "", "", "", ""];
  gameActive = true;
  statusText.textContent = `Tour du joueur ${currentPlayer}`;
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove('disabled');
  });
}

// --- Reset des scores ---
function resetScores() {
  scoreX = 0;
  scoreO = 0;
  scoreDraw = 0;

  scoreXText.textContent = 0;
  scoreOText.textContent = 0;
  scoreDrawText.textContent = 0;

  localStorage.removeItem("scoreX");
  localStorage.removeItem("scoreO");
  localStorage.removeItem("scoreDraw");
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
resetScoresBtn.addEventListener('click', resetScores);

// Charger les scores au démarrage
loadScores();
