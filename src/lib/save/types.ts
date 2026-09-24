import { UnitKey } from "@/game/config/units";

export interface SaveData {
  bounty: number;
  unitLevels: Record<UnitKey, number>;
  highestStage: number;
  settings: {
    sound: boolean;
  };
  updatedAt: number;
}
