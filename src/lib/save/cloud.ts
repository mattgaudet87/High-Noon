import { SaveData } from "./types";
import { loadLocal, normalizeSave, overwriteLocal } from "./local";

const PIN = process.env.NEXT_PUBLIC_SAVE_PIN ?? "";
const PULL_TIMEOUT_MS = 4000;

function headers(): HeadersInit {
  return { "x-save-pin": PIN };
}

// Called once at boot. Compares the local save against the cloud save and
// keeps whichever is newer, so playing on a second device catches up.
// Any failure (no Turso configured, offline, slow network) just falls back
// to the local save, so the game is always playable.
export async function syncOnLoad(): Promise<SaveData> {
  const local = loadLocal();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PULL_TIMEOUT_MS);

    const res = await fetch("/api/save", { headers: headers(), signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return local;

    const cloud = (await res.json()) as SaveData | null;

    if (!cloud) {
      pushCloudSave(local);
      return local;
    }

    if (cloud.updatedAt > local.updatedAt) {
      return overwriteLocal(normalizeSave(cloud));
    }

    if (local.updatedAt > cloud.updatedAt) {
      pushCloudSave(local);
    }

    return local;
  } catch {
    return local;
  }
}

// Fire-and-forget push after a local change (bounty earned, unit upgraded).
// Swallows all errors so a flaky connection never interrupts play.
export function pushCloudSave(save: SaveData): void {
  fetch("/api/save", {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(save),
  }).catch(() => {
    // Turso unreachable, offline, or not configured yet. Local save stands.
  });
}
