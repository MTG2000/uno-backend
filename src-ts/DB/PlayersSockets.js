const socketToServerPlayer = {};

const addPlayer = (socketID, playerID, serverID) => {
    socketToServerPlayer[socketID] = {playerID, serverID}
}

const removePlayer = (socketID) => {
    delete socketToServerPlayer[socketID];
}

const getPlayer = socketID => socketToServerPlayer[socketID];

module.exports = {
    addPlayer,
    removePlayer,
    getPlayer
}