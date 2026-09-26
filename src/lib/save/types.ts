import { UnitKey } from "@/game/config/units";
import { GlobalUpgradeKey } from "@/game/config/globalUpgrades";

export interface SaveData {
  bounty: number;
  unitLevels: Record<UnitKey, number>;
  highestStage: number;
  settings: {
    sound: boolean;
    globalUpgrades: Record<GlobalUpgradeKey, number>;
    seenLevelIntroIds: number[];
  };
  updatedAt: number;
}

export type SlotId = "slot1" | "slot2" | "slot3";

export const SLOT_IDS: SlotId[] = ["slot1", "slot2", "slot3"];
