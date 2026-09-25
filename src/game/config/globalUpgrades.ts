// Permanent, account-wide upgrades bought with Bounty in the General Store.
// Unlike unit levels (which upgrade one troop type), these boost every
// lawman on the field at once. Meant to matter most on the harder, later
// stages where raw numbers start to count more than tactics alone.
export type GlobalUpgradeKey = "allHealth" | "allSpeed" | "allDamage";

export interface GlobalUpgradeDef {
  name: string;
  description: string;
  bonusPerLevel: number;
}

export const GLOBAL_UPGRADE_MAX_LEVEL = 5;

export const GLOBAL_UPGRADES: Record<GlobalUpgradeKey, GlobalUpgradeDef> = {
  allHealth: {
    name: "Grit",
    description: "All lawmen get more HP",
    bonusPerLevel: 0.06,
  },
  allSpeed: {
    name: "Fast Boots",
    description: "All lawmen march and chase faster",
    bonusPerLevel: 0.06,
  },
  allDamage: {
    name: "Sharp Iron",
    description: "All lawmen hit harder",
    bonusPerLevel: 0.06,
  },
};

export const GLOBAL_UPGRADE_KEYS = Object.keys(GLOBAL_UPGRADES) as GlobalUpgradeKey[];

export const GLOBAL_UPGRADE_COSTS: Record<number, number> = {
  1: 80,
  2: 150,
  3: 250,
  4: 400,
  5: 600,
};

export function getGlobalUpgradeMultiplier(
  globalUpgrades: Record<GlobalUpgradeKey, number>,
  key: GlobalUpgradeKey
): number {
  const level = globalUpgrades[key] ?? 0;
  return 1 + GLOBAL_UPGRADES[key].bonusPerLevel * level;
}
