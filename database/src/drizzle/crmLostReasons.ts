import { uuid, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { salesSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const crmLostReasons = salesSchema.table("lost_reasons", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooLostReasonId: integer("odoo_lost_reason_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
