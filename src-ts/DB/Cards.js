"use strict";
exports.__esModule = true;
exports.getCard = void 0;
var cards = require("./data.json").cards;
var getCard = function (cardId) {
    return cards.find(function (c) { return c.id === cardId; });
};
exports.getCard = getCard;
