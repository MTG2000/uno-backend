const { getCard } = require("./DB/Cards");
const {
  getServer,
  setServer,
  deleteServer,
  getAllServers,
} = require("./DB/Servers");
const { addPlayer, removePlayer, getPlayer } = require("./DB/PlayersSockets");
const { io } = require("./server");
const { getBots } = require("./DB/Bots");
const GameServer = require("./GameServer");

function joinServer({
  serverId,
  serverPassword = "",
  player,
  socket,
  cb = () => {},
}) {
  const server = getServer(serverId);

  if (!server) throw new Error("Server Doesn't Exist");
  if (server.serverPassword !== serverPassword)
    throw new Error("Invalid Server Password");
  if (player.name.trim().length <= 1) throw new Error("Player Name too short");
  if (server.players.length >= server.numberOfPlayers)
    throw new Error("Server is Already full");

  let playerId;
  if (socket) {
    player.socketId = socket.id;
    socket.join(serverId);
    playerId = server.joinPlayer(player);
    addPlayer(socket.id, playerId, serverId);
  } else {
    playerId = server.joinPlayer(player);
  }

  cb(null, playerId);

  io.to(serverId).emit("players-changed", server.players);

  // TO BE REMOVED (ONLY FOR DEVELOPMENT)
  if (server.players.length === 2) {
    setTimeout(() => {
      const botsToAdd = getBots(server.numberOfPlayers - server.players.length);
      for (const bot of botsToAdd) {
        joinServer({
          serverId,
          serverPassword: server.serverPassword,
          player: {
            ...bot,
            isBot: true,
          },
        });
      }
    }, 5000);
    return;
  }

  if (server.players.length === server.numberOfPlayers) {
    initGame(server);
  }
}

function createServer({ serverName, serverPassword }) {
  if (serverName.trim().length < 2) throw new Error();
  const server = new GameServer(serverName, serverPassword);
  const serverId = server.serverId;
  setServer(server);
  server.init();
  return serverId;
}

function addBots({ socket }) {
  const { playerId, serverId } = getPlayer(socket.id);
  const server = getServer(serverId);
  if (!server.isAdmin(playerId)) throw new Error("Only Admin Can Add Bots");
  const botsToAdd = getBots(server.numberOfPlayers - server.players.length);
  for (const bot of botsToAdd) {
    joinServer({
      serverId,
      serverPassword: server.serverPassword,
      player: { ...bot, isBot: true },
    });
  }
  io.to(serverId).emit("players-changed", server.players);
  if (server.players.length === server.numberOfPlayers) {
    initGame(server);
  }
}

function initGame(server) {
  setTimeout(() => {
    server.start();
    const playersToSend = server.players.map((player) => ({
      ...player,
      cards: [], // just empty cards objects
    }));
    for (const player of server.players) {
      if (player.socketId) {
        io.to(player.socketId).emit("init-game", {
          players: playersToSend,
          cards: player.cards,
        });
      }
    }
  }, 2000);
}

function startGame(serverId) {
  const server = getServer(serverId);
  if (!server.gameRunning) {
    server.gameRunning = true;
    if (
      server.players[server.curPlayer].disconnected ||
      server.players[server.curPlayer].isBot
    ) {
      setTimeout(() => {
        moveBot(server);
      }, 1500);
    }
    server.onFinish((playersOrdered) => {
      io.to(serverId).emit("finished-game", playersOrdered);
    });
  }
}

function moveBot(server) {
  if (!server) return;
  const { card, nxtPlayer, draw } = server.moveBot();
  io.to(server.serverId).emit("move", {
    nxtPlayer,
    card,
    draw,
  });

  if (
    server.players[server.curPlayer] &&
    (server.players[server.curPlayer].disconnected ||
      server.players[server.curPlayer].isBot)
  ) {
    setTimeout(() => {
      moveBot(server);
    }, 1500);
  }
}

function move({ socket, cardId, draw }) {
  const { playerId, serverId } = getPlayer(socket.id);
  const server = getServer(serverId);
  const card = getCard(cardId);

  // Check if its my turn
  if (server.players[server.curPlayer].id !== playerId)
    throw new Error("Not Your Turn");

  // Make the move
  const { nxtPlayer, cardsToDraw } = server.move(draw, card);

  //broadcast to all OTHER players
  socket.broadcast.to(serverId).emit("move", {
    nxtPlayer,
    card,
    draw: cardsToDraw?.length,
  });

  //send to my player
  socket.emit("move", {
    nxtPlayer,
    card,
    draw: cardsToDraw?.length,
    cardsToDraw,
  });
  if (
    server.players[server.curPlayer].disconnected ||
    server.players[server.curPlayer].isBot
  ) {
    setTimeout(() => {
      moveBot(server);
    }, 1500);
  }
}

function leaveServer(socket) {
  try {
    const player = getPlayer(socket.id);
    const { playerId, serverId } = player;
    const server = getServer(serverId);

    server.leavePlayer(playerId);
    let connectedPlayer = 0;
    for (const p of server.players) {
      if (!p.disconnected && !p.isBot) connectedPlayer++;
    }
    if (connectedPlayer === 0) deleteServer(serverId);

    socket.leave(serverId);
    if (server.gameRunning) io.to(serverId).emit("player-left", playerId);
    else io.to(serverId).emit("players-changed", server.players);

    if (
      server.players[server.curPlayer].isBot &&
      server.players[server.curPlayer].id === playerId
    )
      moveBot(server);

    removePlayer(socket.id);
  } catch (error) {}
}

module.exports = {
  joinServer,
  createServer,
  addBots,
  initGame,
  startGame,
  move,
  leaveServer,
};
