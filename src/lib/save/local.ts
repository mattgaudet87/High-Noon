import { UNITS, UnitKey } from "@/game/config/units";
import { GLOBAL_UPGRADE_KEYS, GlobalUpgradeKey } from "@/game/config/globalUpgrades";
import { SaveData, SlotId, SLOT_IDS } from "./types";

const LEGACY_SAVE_KEY = "hn_save";
const ACTIVE_SLOT_KEY = "hn_active_slot";
const UNIT_KEYS = Object.keys(UNITS) as UnitKey[];

function slotKey(slotId: SlotId): string {
  return `hn_save_${slotId}`;
}

export const DEFAULT_SAVE: SaveData = {
  bounty: 0,
  unitLevels: UNIT_KEYS.reduce((levels, key) => {
    levels[key] = 1;
    return levels;
  }, {} as Record<UnitKey, number>),
  highestStage: 1,
  settings: {
    sound: true,
    globalUpgrades: GLOBAL_UPGRADE_KEYS.reduce((levels, key) => {
      levels[key] = 0;
      return levels;
    }, {} as Record<GlobalUpgradeKey, number>),
    seenLevelIntroIds: [],
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

// Fills in level 0 (not purchased) for any global upgrade a save doesn't
// know about yet, so an old save made before global upgrades existed still
// loads cleanly.
function normalizeGlobalUpgrades(
  levels: Partial<Record<GlobalUpgradeKey, number>> | undefined
) {
  const result = {} as Record<GlobalUpgradeKey, number>;
  for (const key of GLOBAL_UPGRADE_KEYS) {
    result[key] = levels?.[key] ?? 0;
  }
  return result;
}

export function normalizeSave(data: Partial<SaveData>): SaveData {
  return {
    ...DEFAULT_SAVE,
    ...data,
    unitLevels: normalizeUnitLevels(data.unitLevels),
    settings: {
      ...DEFAULT_SAVE.settings,
      ...data.settings,
      globalUpgrades: normalizeGlobalUpgrades(data.settings?.globalUpgrades),
      seenLevelIntroIds: data.settings?.seenLevelIntroIds ?? [],
    },
  };
}

export function getActiveSlot(): SlotId {
  try {
    const raw = localStorage.getItem(ACTIVE_SLOT_KEY);
    if (raw && SLOT_IDS.includes(raw as SlotId)) return raw as SlotId;
  } catch {
    // localStorage unavailable, fall through to the default slot.
  }
  return "slot1";
}

export function setActiveSlot(slotId: SlotId): void {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
  } catch {
    // localStorage unavailable (private mode, blocked, etc). Game keeps running in memory.
  }
}

// Moves a save made before slots existed ("hn_save") into slot1, but only
// if slot1 is still empty, so it never overwrites a slot the player already
// has. Safe to call every boot.
export function migrateLegacySave(): void {
  try {
    if (localStorage.getItem(slotKey("slot1"))) return;
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return;
    localStorage.setItem(slotKey("slot1"), legacy);
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    // localStorage unavailable. Nothing to migrate.
  }
}

// Raw read of one slot. Returns null when the slot has never been saved to,
// so callers (the Home screen) can tell an empty slot from a fresh save.
export function loadSlotRaw(slotId: SlotId): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(slotId));
    if (!raw) return null;
    return normalizeSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadLocal(slotId: SlotId = getActiveSlot()): SaveData {
  return loadSlotRaw(slotId) ?? DEFAULT_SAVE;
}

export function saveLocal(data: SaveData, slotId: SlotId = getActiveSlot()): SaveData {
  const stamped = { ...data, updatedAt: Date.now() };
  return overwriteLocal(stamped, slotId);
}

// Writes save data as-is, without touching updatedAt. Used when merging in a
// cloud save that already carries the correct timestamp.
export function overwriteLocal(data: SaveData, slotId: SlotId = getActiveSlot()): SaveData {
  try {
    localStorage.setItem(slotKey(slotId), JSON.stringify(data));
  } catch {
    // localStorage unavailable (private mode, blocked, etc). Game keeps running in memory.
  }
  return data;
}

export function deleteSlotLocal(slotId: SlotId): void {
  try {
    localStorage.removeItem(slotKey(slotId));
  } catch {
    // localStorage unavailable. Nothing to delete.
  }
}
