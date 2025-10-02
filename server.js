const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameState = {
  players: {}, // { socketId: { name, emoji, position, score, rank } }
  tickets: [],
  nextId: 1
};

// Servir arquivos estáticos
app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("Novo jogador:", socket.id);

  // Inicializar jogador
  gameState.players[socket.id] = {
    name: "",
    emoji: "",
    position: { col: 4, row: 3 },
    score: 0,
    rank: "Estagiário"
  };

  // Enviar estado atual para o jogador
  socket.emit("init", gameState);

  // Atualizar jogador
  socket.on("updatePlayer", (playerData) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id] = { ...gameState.players[socket.id], ...playerData };
      io.emit("updateGameState", gameState);
    }
  });

  // Novo ticket
  socket.on("newTicket", (ticketData) => {
    ticketData.id = gameState.nextId++;
    gameState.tickets.push(ticketData);
    io.emit("updateGameState", gameState);
  });

  // Desarmar ticket
  socket.on("disarmTicket", (ticketId, socketId) => {
    const ticket = gameState.tickets.find(t => t.id === ticketId && t.status === "ativo");
    if (ticket) {
      ticket.status = "desarmado";
      const player = gameState.players[socketId];
      if (player) player.score += ticket.prioridadeData.pontos;
      io.emit("updateGameState", gameState);
    }
  });

  // Jogador desconectou
  socket.on("disconnect", () => {
    delete gameState.players[socket.id];
    io.emit("updateGameState", gameState);
    console.log("Jogador saiu:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
