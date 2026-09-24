import { SaveData } from "./types";

const SAVE_KEY = "hn_save";

export const DEFAULT_SAVE: SaveData = {
  bounty: 0,
  unitLevels: {
    brawler: 1,
    gunslinger: 1,
    rider: 1,
  },
  highestStage: 1,
  settings: {
    sound: true,
  },
  updatedAt: 0,
};

export function loadLocal(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SAVE;
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) } as SaveData;
  } catch {
    return DEFAULT_SAVE;
  }
}

export function saveLocal(data: SaveData): SaveData {
  const stamped = { ...data, updatedAt: Date.now() };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(stamped));
  } catch {
    // localStorage unavailable (private mode, blocked, etc). Game keeps running in memory.
  }
  return stamped;
}
