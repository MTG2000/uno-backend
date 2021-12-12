const bots = require("./data.json").bots;
const { shuffle } = require("../helpers");

exports.getBots = function (number) {
  return shuffle(bots).slice(0, number);
};
