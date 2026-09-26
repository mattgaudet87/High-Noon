import { STAT_BONUS_PER_LEVEL } from "./upgrades";

export const BOSS_NAME = "The Foreman";

// The Hideout's boss guard. It has no cost or UnitKey of its own: the player
// never deploys it and it sits outside the five-way counter cycle, so it
// doesn't need a shop entry or save-file level like the regular troops.
const BASE_BOSS_STATS = {
  hp: 320,
  damage: 24,
  range: 50,
  speed: 22,
  attackCooldown: 1.0,
};

// Scales with stage difficulty the same way outlaw troops do, using the
// enemy level for that stage (see Stage.enemyLevel in config/stages.ts).
export function getBossStats(level: number) {
  const bonus = 1 + STAT_BONUS_PER_LEVEL * (level - 1);
  return {
    name: BOSS_NAME,
    hp: Math.round(BASE_BOSS_STATS.hp * bonus),
    damage: Math.round(BASE_BOSS_STATS.damage * bonus),
    range: BASE_BOSS_STATS.range,
    speed: BASE_BOSS_STATS.speed,
    attackCooldown: BASE_BOSS_STATS.attackCooldown,
  };
}
