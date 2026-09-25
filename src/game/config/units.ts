export type UnitKey =
  | "brawler"
  | "gunslinger"
  | "rider"
  | "shotgunner"
  | "sharpshooter"
  | "doc"
  | "powderman";

// The five troops above take part in the counter cycle. Doc and Powder Man
// are support troops: they never counter and are never countered, so they
// sit outside that cycle entirely (see COUNTERS below).
export type CombatUnitKey =
  | "brawler"
  | "gunslinger"
  | "rider"
  | "shotgunner"
  | "sharpshooter";

export type UnitBehavior = "attack" | "heal" | "splash";

export interface UnitStats {
  name: string;
  cost: number;
  hp: number;
  damage: number;
  range: number;
  speed: number;
  attackCooldown: number;
  // Defaults to "attack" (fight the nearest enemy) when omitted.
  behavior?: UnitBehavior;
  // Only used by "splash" behavior: extra radius around the primary target
  // that also takes damage.
  splashRadius?: number;
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
  doc: {
    name: "Doc",
    cost: 35,
    hp: 45,
    damage: 9,
    range: 70,
    speed: 28,
    attackCooldown: 1.0,
    behavior: "heal",
  },
  powderman: {
    name: "Powder Man",
    cost: 35,
    hp: 50,
    damage: 10,
    range: 22,
    speed: 30,
    attackCooldown: 0.9,
    behavior: "splash",
    splashRadius: 40,
  },
};

// Each combat unit beats the one it points to and takes double damage from
// it in return. This is a five-way cycle: Brawler beats Gunslinger,
// Gunslinger beats Rider, Rider beats Shotgunner, Shotgunner beats
// Sharpshooter, and Sharpshooter beats Brawler. Doc and Powder Man are
// support troops and have no entry here, so they never counter or get
// countered.
export const COUNTERS: Partial<Record<UnitKey, UnitKey>> = {
  brawler: "gunslinger",
  gunslinger: "rider",
  rider: "shotgunner",
  shotgunner: "sharpshooter",
  sharpshooter: "brawler",
};

export const COUNTER_MULTIPLIER = 2;
