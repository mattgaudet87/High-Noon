export type UnitKey = "brawler" | "gunslinger" | "rider" | "shotgunner" | "sharpshooter";

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
  shotgunner: {
    name: "Shotgunner",
    cost: 30,
    hp: 55,
    damage: 16,
    range: 45,
    speed: 26,
    attackCooldown: 1.0,
  },
  sharpshooter: {
    name: "Sharpshooter",
    cost: 50,
    hp: 30,
    damage: 22,
    range: 150,
    speed: 24,
    attackCooldown: 1.3,
  },
};

// Each unit beats the one it points to and takes double damage from it in
// return. This is a five-way cycle: Brawler beats Gunslinger, Gunslinger
// beats Rider, Rider beats Shotgunner, Shotgunner beats Sharpshooter, and
// Sharpshooter beats Brawler.
export const COUNTERS: Record<UnitKey, UnitKey> = {
  brawler: "gunslinger",
  gunslinger: "rider",
  rider: "shotgunner",
  shotgunner: "sharpshooter",
  sharpshooter: "brawler",
};

export const COUNTER_MULTIPLIER = 2;
