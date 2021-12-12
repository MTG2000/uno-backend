const { getAllServers, getServerPlayers } = require("./DB/Servers");
const { getPlayer } = require("./DB/PlayersSockets");
const { io } = require("./server");

const API = require("./api");

io.on("connection", (socket) => {
  socket.on("get-servers", (_, cb = () => {}) => {
    try {
      cb(null, getAllServers());
    } catch (error) {
      cb(error);
      console.log(error);
    }
  });

  socket.on("get-server-players", (_, cb = () => {}) => {
    try {
      const { serverId } = getPlayer(socket.id);
      cb(null, getServerPlayers(serverId));
    } catch (error) {
      cb(error);
      console.log(error);
    }
  });

  socket.on(
    "create-server",
    ({ serverName, serverPassword, player }, cb = () => {}) => {
      try {
        const serverId = API.createServer({ serverName, serverPassword });
        API.joinServer({ serverId, serverPassword, player, socket, cb });
      } catch (error) {
        cb(error);
        console.log(error);
      }
    }
  );

  socket.on(
    "join-server",
    ({ serverId, serverPassword, player }, cb = () => {}) => {
      try {
        API.joinServer({ serverId, serverPassword, player, socket, cb });
      } catch (error) {
        cb(error);
        console.log(error);
      }
    }
  );

  socket.on("add-bots", (_, cb = () => {}) => {
    try {
      API.addBots({ socket });
    } catch (error) {
      cb(error);
      console.log(error);
    }
  });

  socket.on("start-game", (_, cb = () => {}) => {
    try {
      const { serverId } = getPlayer(socket.id);
      API.startGame(serverId);
    } catch (err) {
      cb(err);
    }
  });

  socket.on("move", ({ cardId, draw }, cb = () => {}) => {
    try {
      API.move({ socket, cardId, draw });
      cb(null);
    } catch (error) {
      cb(error);
      console.log(error);
    }
  });

  // socket.on("play-again", ({ player }, cb = () => {}) => {
  //   try {
  //     const { playerId, serverId } = getPlayer(socket.id);
  //     const server = getServer(serverId);
  //     if (!server.gameRunning) {
  //       server.join(player);
  //       io.to(serverId).emit("players-changed", server.players);
  //       if (server.players.length === server.numberOfPlayers) {
  //         startGame(server);
  //       }

  //       cb(null, playerId);
  //     }
  //   } catch (error) {
  //     cb(error);
  //     console.log(error);
  //   }
  // });

  socket.on("leave-server", () => {
    API.leaveServer(socket);
  });

  socket.on("disconnect", () => {
    API.leaveServer(socket);
  });
});
