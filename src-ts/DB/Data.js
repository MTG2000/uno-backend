const { nanoid } = require('nanoid');

const servers = {};

const createServer = (serverName, serverPassword) => {
    const server = new GameServer(serverName, serverPassword);
    const serverID = nanoid();
    servers[serverID] = server;
    server.init();
    return serverID;
}

const joinServer = (serverID, serverPassword, player) => {
    const server = servers[serverID];
  
    if (!server) return false; 
    if (server.password !== serverPassword) return false; 
    if (player.name.trim().length <= 1) return false; 
    if (server.players.length >= 4) return false;

    const playerId = server.join(player);

    return playerId;
}

const getServer = (id) => servers[id];

module.exports = {
    createServer,
    joinServer,
    getServer
};