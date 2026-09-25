import { UNITS, UnitKey, COUNTERS } from "@/game/config/units";
import { STARTING_GRUB, GRUB_PER_SECOND } from "@/game/config/economy";
import { Stage } from "@/game/config/stages";

const UNIT_KEYS = Object.keys(UNITS) as UnitKey[];
const DECISION_INTERVAL = 1.5;

// Reverse of COUNTERS: for a given unit, which unit deals double damage to it.
const COUNTERED_BY: Record<UnitKey, UnitKey> = UNIT_KEYS.reduce((map, key) => {
  map[COUNTERS[key]] = key;
  return map;
}, {} as Record<UnitKey, UnitKey>);

export class EnemyAI {
  private grub = STARTING_GRUB;
  private decisionTimer = 0;

  constructor(private stage: Stage) {}

  update(dt: number, lawmenOnField: UnitKey[], onSpawn: (key: UnitKey) => void) {
    this.grub += GRUB_PER_SECOND * this.stage.enemyGrubMultiplier * dt;

    this.decisionTimer += dt;
    if (this.decisionTimer < DECISION_INTERVAL) return;
    this.decisionTimer -= DECISION_INTERVAL;

    const pick = this.chooseUnit(lawmenOnField);
    const cost = UNITS[pick].cost;
    if (this.grub >= cost) {
      this.grub -= cost;
      onSpawn(pick);
    }
    // Otherwise the outlaws wait and save up; they will decide again next cycle.
  }

  private chooseUnit(lawmenOnField: UnitKey[]): UnitKey {
    if (lawmenOnField.length === 0) {
      return UNIT_KEYS[Math.floor(Math.random() * UNIT_KEYS.length)];
    }

    const counts: Partial<Record<UnitKey, number>> = {};
    for (const key of lawmenOnField) {
      counts[key] = (counts[key] ?? 0) + 1;
    }

    let mostCommon: UnitKey = lawmenOnField[0];
    let highestCount = 0;
    for (const key of UNIT_KEYS) {
      const count = counts[key] ?? 0;
      if (count > highestCount) {
        highestCount = count;
        mostCommon = key;
      }
    }

    if (Math.random() < this.stage.counterChance) {
      return COUNTERED_BY[mostCommon];
    }

    return UNIT_KEYS[Math.floor(Math.random() * UNIT_KEYS.length)];
  }
}
