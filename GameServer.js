const { wrapMod, shuffle } = require("./helpers");
const { nanoid } = require("nanoid");
const data = require("./DB/data.json");

class GameServer {
  serverId;
  serverName;
  serverPassword;

  players = [];
  curPlayer = 0;
  direction = 1;
  tableStk = [];
  drawingStk = [];
  sumDrawing = 0;
  lastPlayerDrew = false;
  playersFinished = [];
  gameRunning = false;

  constructor(serverName, serverPassword, numberOfPlayers = 4) {
    this.serverId = nanoid();
    this.serverName = serverName;
    this.serverPassword = serverPassword;
    this.numberOfPlayers = numberOfPlayers;
  }

  init() {
    this.players = [];
    this.curPlayer = 0;
    this.direction = 1;
    this.tableStk = [];
    this.drawingStk = [];
    this.sumDrawing = 0;
    this.playersFinished = [];
    this.lastPlayerDrew = false;
    this.gameRunning = false;
  }

  joinPlayer(player) {
    const playerId = nanoid();

    this.players.push({
      ...player,
      id: playerId,
      cards: [],
    });
    return playerId;
  }

  isAdmin(playerId) {
    return this.players.length && this.players[0].id === playerId;
  }

  leavePlayer(playerId) {
    if (!this.gameRunning) {
      this.players = this.players.filter((p) => p.id !== playerId);
    } else {
      const player = this.players.find((p) => p.id === playerId);
      player.disconnected = true;
      player.isBot = true;
    }
  }

  start() {
    const cards = [...data.cards];
    shuffle(cards);
    shuffle(this.players);
    const NUM_CARDS = 7;
    this.players.forEach((player, idx) => {
      player.cards = cards.slice(idx * NUM_CARDS, (idx + 1) * NUM_CARDS);
    });
    this.drawingStk = cards.slice(
      this.players.length * NUM_CARDS,
      cards.length
    );
  }

  move(draw, card) {
    let moveEventObj = { nxtPlayer: 0, curPlayer: 0 };

    if (card && !canPlayCard(this.tableStk[0], card, this.lastPlayerDrew))
      return false;

    if (draw) {
      let drawCnt = 1;
      if (this.sumDrawing) {
        drawCnt = this.sumDrawing;
        this.sumDrawing = 0;
      }

      moveEventObj.draw = drawCnt;
      if (drawCnt + 1 > this.drawingStk.length) {
        this.drawingStk = shuffle(this.tableStk.slice(5, this.tableStk.length));
        this.tableStk = this.tableStk.slice(0, 5);
      }

      moveEventObj.cardsToDraw = this.drawingStk.slice(0, drawCnt);
      this.players[this.curPlayer].cards = this.drawingStk
        .slice(0, drawCnt)
        .concat(this.players[this.curPlayer].cards);

      this.drawingStk = this.drawingStk.slice(drawCnt, this.drawingStk.length);
      this.lastPlayerDrew = true;
    }

    let nxtPlayer = this.getNextPlayer(card);

    moveEventObj.curPlayer = this.curPlayer;
    moveEventObj.nxtPlayer = nxtPlayer;

    if (card) {
      if (card.action === "draw two") this.sumDrawing += 2;
      if (card.action === "draw four") this.sumDrawing += 4;

      this.tableStk.unshift(card);
      moveEventObj.card = card;
      this.players[this.curPlayer].cards = this.players[
        this.curPlayer
      ].cards.filter((c) => c.id !== card.id);
      this.lastPlayerDrew = false;

      // Check if game finished
      if (this.players[this.curPlayer].cards.length === 0)
        this.playersFinished.push(this.curPlayer);
      if (this.playersFinished.length === this.players.length - 1)
        this.finishGame();
    }

    this.curPlayer = nxtPlayer;
    return moveEventObj;
  }

  getNextPlayer(card) {
    let nxtPlayer = this.curPlayer;

    if (card?.action === "reverse") this.direction *= -1;

    //Move to next player ( if not wild card )
    if (card?.action === "skip")
      nxtPlayer = wrapMod(
        this.curPlayer + 2 * this.direction,
        this.players.length
      );
    else if (card?.action !== "wild")
      nxtPlayer = wrapMod(
        this.curPlayer + 1 * this.direction,
        this.players.length
      );

    //if nxtPlayer is out of the game (no cards left with him)
    while (this.players[nxtPlayer].cards.length === 0) {
      nxtPlayer = wrapMod(nxtPlayer + 1 * this.direction, this.players.length);
    }

    return nxtPlayer;
  }

  moveBot() {
    for (let i = 0; i < this.players[this.curPlayer].cards.length; i++) {
      const card = this.players[this.curPlayer].cards[i];

      if (canPlayCard(this.tableStk[0], card, this.lastPlayerDrew))
        return this.move(false, card);
    }

    return this.move(true, null);
  }

  onFinish(cb) {
    this.onFinish = cb;
  }

  finishGame() {
    const lastPlayer = this.players.filter(
      (player) =>
        !this.playersFinished.some(
          (playerFinished) => playerFinished.id === player.id
        )
    );
    this.playersFinished.push(lastPlayer.id);
    const playersFinishingOrder = this.playersFinished.map(
      (idx) => this.players[idx]
    );

    this.init();

    this.onFinish(playersFinishingOrder);
  }
}

function canPlayCard(oldCard, newCard, lastPlayerDrew) {
  const isOldDawingCard =
    oldCard?.action && oldCard.action.indexOf("draw") !== -1;
  const haveToDraw = isOldDawingCard && !lastPlayerDrew;
  const isNewDawingCard =
    newCard?.action && newCard.action.indexOf("draw") !== -1;

  //No Card Played Yet
  if (!oldCard) return true;

  if (!haveToDraw && newCard.action === "wild") return true;

  if (newCard.action === "draw four") return true;

  if (oldCard.color === "black" && !haveToDraw) return true;

  if (haveToDraw && isNewDawingCard) return true;

  if (!haveToDraw && oldCard.color === newCard.color) return true;

  if (oldCard.digit !== undefined && oldCard.digit === newCard.digit)
    return true;

  return false;
}

module.exports = GameServer;
