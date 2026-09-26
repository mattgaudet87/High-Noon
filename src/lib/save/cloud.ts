import { SaveData, SlotId, SLOT_IDS } from "./types";
import { getActiveSlot, loadSlotRaw, normalizeSave, overwriteLocal } from "./local";

const PIN = process.env.NEXT_PUBLIC_SAVE_PIN ?? "";
const PULL_TIMEOUT_MS = 4000;

function headers(): HeadersInit {
  return { "x-save-pin": PIN };
}

type CloudSlots = Record<SlotId, SaveData | null>;

// Called once at boot, before the Home screen reads slot summaries. Pulls
// all 3 slots from the cloud, compares each against its local copy, and
// keeps whichever is newer so playing on a second device catches up. Any
// failure (no Turso configured, offline, slow network) just falls back to
// the local slots, so the game is always playable.
export async function syncAllSlots(): Promise<CloudSlots> {
  const local = Object.fromEntries(
    SLOT_IDS.map((slotId) => [slotId, loadSlotRaw(slotId)])
  ) as CloudSlots;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PULL_TIMEOUT_MS);

    const res = await fetch("/api/save", { headers: headers(), signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return local;

    const cloud = (await res.json()) as Partial<CloudSlots>;
    const merged = { ...local };

    for (const slotId of SLOT_IDS) {
      const cloudSlot = cloud[slotId];
      const localSlot = local[slotId];

      if (cloudSlot && (!localSlot || cloudSlot.updatedAt > localSlot.updatedAt)) {
        merged[slotId] = overwriteLocal(normalizeSave(cloudSlot), slotId);
      } else if (localSlot && (!cloudSlot || localSlot.updatedAt > cloudSlot.updatedAt)) {
        pushCloudSave(localSlot, slotId);
      }
    }

    return merged;
  } catch {
    return local;
  }
}

// Fire-and-forget push after a local change (bounty earned, unit upgraded).
// Defaults to the active slot so existing call sites don't need to know
// about slots. Swallows all errors so a flaky connection never interrupts
// play.
export function pushCloudSave(save: SaveData, slotId: SlotId = getActiveSlot()): void {
  fetch(`/api/save?slot=${slotId}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(save),
  }).catch(() => {
    // Turso unreachable, offline, or not configured yet. Local save stands.
  });
}

// Fire-and-forget delete, so a deleted slot can't come back on the next
// sync from a stale cloud copy.
export function deleteCloudSave(slotId: SlotId): void {
  fetch(`/api/save?slot=${slotId}`, {
    method: "DELETE",
    headers: headers(),
  }).catch(() => {
    // Turso unreachable, offline, or not configured yet. Local delete stands.
  });
}
