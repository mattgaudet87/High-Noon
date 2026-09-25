import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const saves = sqliteTable("saves", {
  id: text("id").primaryKey(),
  bounty: integer("bounty").notNull(),
  unitLevels: text("unit_levels").notNull(),
  highestStage: integer("highest_stage").notNull(),
  settings: text("settings").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
