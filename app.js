const socket = io(); // conecta automaticamente ao servidor online
let gameState = { player: {}, players: {}, tickets: [] };

// Configurações do jogo (mesmo que você já tinha)
const CONFIG = {
  grid: { colunas: 10, linhas: 8, safeZone: { startCol: 3, startRow: 2, width: 4, height: 4 } },
  prioridades: [
    { codigo: "P1", nome: "Crítico", minutos: 30, cor: "#FF4444", pontos: 20 },
    { codigo: "P2", nome: "Alto", minutos: 120, cor: "#FF8800", pontos: 15 },
    { codigo: "P3", nome: "Médio", minutos: 480, cor: "#44AA44", pontos: 10 },
    { codigo: "P4", nome: "Baixo", minutos: 1440, cor: "#4488FF", pontos: 5 }
  ],
  patentes: [
    { min_pontos: 0, nome: "Estagiário", icon: "🔰" },
    { min_pontos: 50, nome: "Júnior", icon: "🎯" },
    { min_pontos: 150, nome: "Pleno", icon: "⚡" },
    { min_pontos: 300, nome: "Sênior", icon: "🔥" },
    { min_pontos: 500, nome: "Especialista", icon: "💎" },
    { min_pontos: 1000, nome: "Mestre SLA", icon: "👑" }
  ],
  movementSpeed: 200
};

// Conexão Socket.IO
socket.on("init", (state) => {
  gameState = state;
  renderAll();
});

socket.on("updateGameState", (state) => {
  gameState = state;
  renderAll();
});

// Login
document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("playerName").value.trim();
  if (!name) return alert("Digite seu nome!");
  gameState.players[socket.id].name = name;
  gameState.players[socket.id].emoji = "😎";
  socket.emit("updatePlayer", gameState.players[socket.id]);
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
});

// Funções principais
function renderAll() {
  renderGrid();
  renderPlayers();
  renderTickets();
}

function renderGrid() {
  const grid = document.getElementById("battlefieldGrid");
  grid.innerHTML = "";
  for (let row = 0; row < CONFIG.grid.linhas; row++) {
    for (let col = 0; col < CONFIG.grid.colunas; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      if (col >= CONFIG.grid.safeZone.startCol && col < CONFIG.grid.safeZone.startCol + CONFIG.grid.safeZone.width &&
          row >= CONFIG.grid.safeZone.startRow && row < CONFIG.grid.safeZone.startRow + CONFIG.grid.safeZone.height) {
        cell.classList.add("safe-zone");
      }
      cell.dataset.col = col;
      cell.dataset.row = row;
      grid.appendChild(cell);
    }
  }
}

function renderPlayers() {
  document.querySelectorAll(".player").forEach(p => p.remove());
  Object.values(gameState.players).forEach(p => {
    const cell = document.querySelector(`[data-col='${p.position.col}'][data-row='${p.position.row}']`);
    if (!cell) return;
    const el = document.createElement("div");
    el.className = "player";
    el.textContent = `${p.emoji} ${p.name} (${p.score})`;
    cell.appendChild(el);
  });
}

function renderTickets() {
  document.querySelectorAll(".bomb").forEach(b => b.remove());
  gameState.tickets.filter(t => t.status === "ativo").forEach(t => {
    const cell = document.querySelector(`[data-col='${t.position.col}'][data-row='${t.position.row}']`);
    if (!cell) return;
    const bomb = document.createElement("div");
    bomb.className = `bomb bomb--${t.prioridade.toLowerCase()}`;
    bomb.textContent = `${t.analista}💣`;
    bomb.addEventListener("click", () => socket.emit("disarmTicket", t.id, socket.id));
    cell.appendChild(bomb);
  });
}

// Movimentação simples
document.addEventListener("keydown", e => {
  const player = gameState.players[socket.id];
  if (!player) return;
  let { col, row } = player.position;
  if (e.code === "KeyW" || e.code === "ArrowUp") row--;
  if (e.code === "KeyS" || e.code === "ArrowDown") row++;
  if (e.code === "KeyA" || e.code === "ArrowLeft") col--;
  if (e.code === "KeyD" || e.code === "ArrowRight") col++;
  col = Math.max(0, Math.min(CONFIG.grid.colunas - 1, col));
  row = Math.max(0, Math.min(CONFIG.grid.linhas - 1, row));
  player.position = { col, row };
  socket.emit("updatePlayer", player);
});
