import { Card } from "../interfaces";

const { cards } = require("./data.json");

export const getCard = (cardId: string) =>
  (cards as Card[]).find((c) => c.id === cardId);
