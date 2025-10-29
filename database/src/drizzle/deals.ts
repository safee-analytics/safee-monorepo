import { uuid, varchar, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { salesSchema, dealStageEnum, idpk } from "./_common.js";
import { organizations } from "./organizations.js";
import { contacts } from "./contacts.js";

export const deals = salesSchema.table(
  "deals",
  {
    id: idpk("id"),
    title: varchar("title", { length: 255 }).notNull(),
    value: decimal("value", { precision: 12, scale: 2 }),
    stage: dealStageEnum("stage").default("LEAD").notNull(),
    probability: integer("probability"),
    expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null", onUpdate: "cascade" }),
    notes: varchar("notes", { length: 1000 }),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("deals_organization_id_idx").on(table.organizationId)],
);
