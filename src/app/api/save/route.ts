import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { saves } from "@/db/schema";

const SAVE_ID = "main";

function checkPin(request: NextRequest): boolean {
  const pin = request.headers.get("x-save-pin");
  return Boolean(process.env.SAVE_PIN) && pin === process.env.SAVE_PIN;
}

export async function GET(request: NextRequest) {
  if (!checkPin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Cloud saves not configured" }, { status: 503 });
  }

  const rows = await db.select().from(saves).where(eq(saves.id, SAVE_ID)).limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    bounty: row.bounty,
    unitLevels: JSON.parse(row.unitLevels),
    highestStage: row.highestStage,
    settings: JSON.parse(row.settings),
    updatedAt: row.updatedAt,
  });
}

export async function PUT(request: NextRequest) {
  if (!checkPin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Cloud saves not configured" }, { status: 503 });
  }

  const body = await request.json();

  const row = {
    id: SAVE_ID,
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
