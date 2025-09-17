import { uuid, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { salesSchema } from "./_common.js";
import { organizations } from "./organizations.js";
import { contacts } from "./contacts.js";
import { DealStage } from "./schema.js";

export const deals = salesSchema.table("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }),
  stage: varchar("stage", { length: 50 }).$type<DealStage>().notNull(),
  probability: integer("probability"),
  expectedCloseDate: timestamp("expected_close_date"),
  contactId: uuid("contact_id").references(() => contacts.id),
  notes: varchar("notes", { length: 1000 }),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
