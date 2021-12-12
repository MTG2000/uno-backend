export interface Player {
  id: string;
  name: string;
  seed: string;
  socketID: string;
  cards: Card[];
}

export interface Card {
  id?: string;
  digit?: number;
  color?: "red" | "blue" | "green" | "yellow" | "black";
  action?: "reverse" | "skip" | "draw two" | "draw four" | "wild";
}
