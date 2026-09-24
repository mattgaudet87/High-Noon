export type UnitKey = "brawler" | "gunslinger" | "rider";

export interface UnitStats {
  name: string;
  cost: number;
  hp: number;
  damage: number;
  range: number;
  speed: number;
  attackCooldown: number;
}

export const UNITS: Record<UnitKey, UnitStats> = {
  brawler: {
    name: "Brawler",
    cost: 15,
    hp: 60,
    damage: 8,
    range: 18,
    speed: 36,
    attackCooldown: 0.66,
  },
  gunslinger: {
    name: "Gunslinger",
    cost: 25,
    hp: 35,
    damage: 7,
    range: 110,
    speed: 30,
    attackCooldown: 0.66,
  },
  rider: {
    name: "Rider",
    cost: 40,
    hp: 90,
    damage: 12,
    range: 20,
    speed: 66,
    attackCooldown: 0.66,
  },
};

// Each unit beats the one it points to and takes double damage from it in return.
export const COUNTERS: Record<UnitKey, UnitKey> = {
  brawler: "gunslinger",
  gunslinger: "rider",
  rider: "brawler",
};

export const COUNTER_MULTIPLIER = 2;
