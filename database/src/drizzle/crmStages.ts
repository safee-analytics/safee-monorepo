import { uuid, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { salesSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const crmStages = salesSchema.table("stages", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooStageId: integer("odoo_stage_id").notNull(),

  name: varchar("name", { length: 100 }).notNull(),
  sequence: integer("sequence").default(10),
  fold: boolean("fold").default(false),
  isWon: boolean("is_won").default(false),
  rottingThresholdDays: integer("rotting_threshold_days"),
  requirements: text("requirements"),
  teamIds: integer("team_ids").array(),
  color: integer("color"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
