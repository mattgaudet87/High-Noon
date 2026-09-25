import { UNITS, UnitKey } from "@/game/config/units";
import { SaveData } from "./types";

const SAVE_KEY = "hn_save";
const UNIT_KEYS = Object.keys(UNITS) as UnitKey[];

export const DEFAULT_SAVE: SaveData = {
  bounty: 0,
  unitLevels: UNIT_KEYS.reduce((levels, key) => {
    levels[key] = 1;
    return levels;
  }, {} as Record<UnitKey, number>),
  highestStage: 1,
  settings: {
    sound: true,
  },
  updatedAt: 0,
};

// Fills in level 1 for any troop type a save doesn't know about yet, so an
// old save made before a new troop type existed still loads cleanly.
function normalizeUnitLevels(levels: Partial<Record<UnitKey, number>> | undefined) {
  const result = {} as Record<UnitKey, number>;
  for (const key of UNIT_KEYS) {
    result[key] = levels?.[key] ?? 1;
  }
  return result;
}

export function normalizeSave(data: Partial<SaveData>): SaveData {
  return {
    ...DEFAULT_SAVE,
    ...data,
    unitLevels: normalizeUnitLevels(data.unitLevels),
  };
}

export function loadLocal(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SAVE;
    return normalizeSave(JSON.parse(raw));
  } catch {
    return DEFAULT_SAVE;
  }
}

export function saveLocal(data: SaveData): SaveData {
  const stamped = { ...data, updatedAt: Date.now() };
  return overwriteLocal(stamped);
}

// Writes save data as-is, without touching updatedAt. Used when merging in a
// cloud save that already carries the correct timestamp.
export function overwriteLocal(data: SaveData): SaveData {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private mode, blocked, etc). Game keeps running in memory.
  }
  return data;
}
