import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { saves } from "@/db/schema";

const SLOT_IDS = ["slot1", "slot2", "slot3"] as const;
type SlotId = (typeof SLOT_IDS)[number];

// A save made before slots existed used a single row with id "main". If a
// slot1 row doesn't exist yet, fall back to it, so a cloud save from before
// this change isn't stranded.
const LEGACY_ID = "main";

function checkPin(request: NextRequest): boolean {
  const pin = request.headers.get("x-save-pin");
  return Boolean(process.env.SAVE_PIN) && pin === process.env.SAVE_PIN;
}

function isSlotId(value: string | null): value is SlotId {
  return SLOT_IDS.includes(value as SlotId);
}

function rowToSave(row: typeof saves.$inferSelect) {
  return {
    bounty: row.bounty,
    unitLevels: JSON.parse(row.unitLevels),
    highestStage: row.highestStage,
    settings: JSON.parse(row.settings),
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  if (!checkPin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Cloud saves not configured" }, { status: 503 });
  }

  const slot = request.nextUrl.searchParams.get("slot");

  if (slot) {
    if (!isSlotId(slot)) {
      return NextResponse.json({ error: "Unknown slot" }, { status: 400 });
    }
    const rows = await db.select().from(saves).where(eq(saves.id, slot)).limit(1);
    let row = rows[0];
    if (!row && slot === "slot1") {
      const legacyRows = await db.select().from(saves).where(eq(saves.id, LEGACY_ID)).limit(1);
      row = legacyRows[0];
    }
    return NextResponse.json(row ? rowToSave(row) : null);
  }

  const rows = await db.select().from(saves);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const legacyRow = byId.get(LEGACY_ID);

  const result: Record<SlotId, ReturnType<typeof rowToSave> | null> = {
    slot1: null,
    slot2: null,
    slot3: null,
  };
  for (const slotId of SLOT_IDS) {
    const row = byId.get(slotId) ?? (slotId === "slot1" ? legacyRow : undefined);
    result[slotId] = row ? rowToSave(row) : null;
  }

  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  if (!checkPin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Cloud saves not configured" }, { status: 503 });
  }

  const slot = request.nextUrl.searchParams.get("slot");
  if (!isSlotId(slot)) {
    return NextResponse.json({ error: "Unknown slot" }, { status: 400 });
  }

  const body = await request.json();

  const row = {
    id: slot,
    bounty: body.bounty,
    unitLevels: JSON.stringify(body.unitLevels),
    highestStage: body.highestStage,
    settings: JSON.stringify(body.settings),
    updatedAt: body.updatedAt,
  };

  await db
    .insert(saves)
    .values(row)
    .onConflictDoUpdate({ target: saves.id, set: row });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!checkPin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Cloud saves not configured" }, { status: 503 });
  }

  const slot = request.nextUrl.searchParams.get("slot");
  if (!isSlotId(slot)) {
    return NextResponse.json({ error: "Unknown slot" }, { status: 400 });
  }

  await db.delete(saves).where(eq(saves.id, slot));
  if (slot === "slot1") {
    await db.delete(saves).where(eq(saves.id, LEGACY_ID));
  }

  return NextResponse.json({ ok: true });
}
