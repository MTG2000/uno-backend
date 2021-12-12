const GameServer = require("../GameServer");

const servers = {};

const setServer = (server) => {
  servers[server.serverId] = server;
};

const getServer = (id) => {
  if (!servers[id]) throw new Error("Server Don't Exist");
  return servers[id];
};

const getServerPlayers = (serverId) => {
  if (!servers[serverId]) throw new Error("Server Don't Exist");
  return servers[serverId].players.map((p) => ({ ...p, cards: [] }));
};

const getAllServers = () =>
  Object.values(servers)
    .filter((server) => !server.gameRunning)
    .map((server) => ({
      id: server.serverId,
      name: server.serverName,
      isPrivate: !!server.serverPassword,
      cntPlayers: `${server.players.length}/${server.numberOfPlayers}`,
    }));

const deleteServer = (serverId) => {
  delete servers[serverId];
};

module.exports = {
  setServer,
  deleteServer,
  getServer,
  getAllServers,
  getServerPlayers,
};
