import { UNITS, UnitKey, UnitStats } from "./units";

export const MAX_LEVEL = 5;
export const STAT_BONUS_PER_LEVEL = 0.12;

export const UPGRADE_COSTS: Record<number, number> = {
  2: 50,
  3: 100,
  4: 175,
  5: 275,
};

export function getUnitStats(key: UnitKey, level: number): UnitStats {
  const base = UNITS[key];
  const bonus = 1 + STAT_BONUS_PER_LEVEL * (level - 1);

  return {
    ...base,
    hp: Math.round(base.hp * bonus),
    damage: Math.round(base.damage * bonus),
  };
}
