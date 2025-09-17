import { uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { salesSchema } from "./_common.js";
import { organizations } from "./organizations.js";
import { ContactType } from "./schema.js";

export const contacts = salesSchema.table("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  type: varchar("type", { length: 50 }).$type<ContactType>().notNull(),
  source: varchar("source", { length: 100 }),
  notes: varchar("notes", { length: 1000 }),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
