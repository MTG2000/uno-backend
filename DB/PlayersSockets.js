const socketToServerPlayer = {};

const addPlayer = (socketId, playerId, serverId) => {
  socketToServerPlayer[socketId] = { playerId, serverId };
};

const removePlayer = (socketId) => {
  delete socketToServerPlayer[socketId];
};

const getPlayer = (socketId) => {
  if (!socketToServerPlayer[socketId])
    throw new Error("Player is not in any server");
  return socketToServerPlayer[socketId];
};

module.exports = {
  addPlayer,
  removePlayer,
  getPlayer,
};
