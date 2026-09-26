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

// Balance pass: every troop's damage-per-second and HP are measured against
// its Grub cost (dps-per-cost, hp-per-cost) so each one earns its price
// instead of some being flatly better than others. Melee troops get the
// best raw efficiency (they pay for it by taking retaliation up close);
// ranged and glass-cannon troops trade efficiency for range, speed, or
// burst. See the balance notes kept alongside this file's git history for
// the full table.
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
    hp: 40,
    damage: 9,
    range: 110,
    speed: 30,
    attackCooldown: 0.66,
  },
  rider: {
    name: "Rider",
    cost: 40,
    hp: 100,
    damage: 15,
    range: 20,
    speed: 66,
    attackCooldown: 0.66,
  },
  shotgunner: {
    name: "Shotgunner",
    cost: 30,
    hp: 62,
    damage: 18,
    range: 45,
    speed: 26,
    attackCooldown: 1.0,
  },
  sharpshooter: {
    name: "Sharpshooter",
    cost: 50,
    hp: 38,
    damage: 30,
    range: 150,
    speed: 24,
    attackCooldown: 1.3,
  },
  doc: {
    name: "Doc",
    cost: 35,
    hp: 50,
    damage: 12,
    range: 70,
    speed: 28,
    attackCooldown: 1.0,
    behavior: "heal",
  },
  powderman: {
    name: "Powder Man",
    cost: 35,
    hp: 50,
    damage: 14,
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
