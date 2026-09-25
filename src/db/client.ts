import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

// Returns null when Turso isn't configured yet, so the API route can fail
// gracefully instead of crashing. The game must stay playable either way.
export function getDb(): Db | null {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) return null;

  const client = createClient({ url, authToken });
  cached = drizzle(client, { schema });
  return cached;
}
