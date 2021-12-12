const cards = require("./data.json").cards;

const getCard = function (cardId) {
  return cards.find((c) => c.id === cardId);
};

exports.getCard = getCard;
