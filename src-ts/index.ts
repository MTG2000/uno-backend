// Typescript Imports
import express from "express";
import * as http from "http";
import { Socket } from "socket.io";
import { getCard } from "./DB/Cards";
import { Player } from "./interfaces";

// Javascript Imports
const { Server } = require("socket.io");
const { createServer, joinServer, getServer } = require("./DB/Data");
const { addPlayer, removePlayer, getPlayer } = require("./DB/PlayersSockets");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket: Socket) => {
  socket.on("create-server", ({ serverName, serverPassword }, cb) => {
    const serverID = createServer(serverName, serverPassword);
    cb(serverID);
  });

  socket.on("join-server", ({ serverID, serverPassword, player }, cb) => {
    const server = getServer(serverID);
    const playerID = joinServer(serverID, serverPassword, player);
    socket.join(serverID);
    cb(playerID);
    addPlayer(socket.id, playerID, serverID);
    io.to(serverID).emit("player-joined", server.players);
    if (server.players.length === 4) {
      server.start();
      const playersToSend = server.players.map((player: Player) => ({
        ...player,
        cards: [] as any[],
      }));
      for (const player of server.players) {
        io.sockets.socket(player.socketID).emit("start-game", {
          players: playersToSend,
          cards: player.cards,
        });
      }
    }
  });

  socket.on("move", ({ cardID, draw }) => {
    const { playerID, serverID } = getPlayer(socket.id);
    const server = getServer(serverID);
    const card = getCard(cardID);
    const { nxtPlayer, cardsToDraw } = server.move(draw, card);
    for (const player of server.players) {
      io.sockets.socket(player.socketID).emit("move", {
        nxtPlayer,
        card,
        draw,
        cardsToDraw: player.id === playerID ? cardsToDraw : [],
      });
    }
  });

  socket.on("disconnect", function () {
    removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`listening on port :${PORT}`);
});
