import { pgTable, uuid, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { salesSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const crmTeams = salesSchema.table("teams", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooTeamId: integer("odoo_team_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  userId: integer("user_id"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
