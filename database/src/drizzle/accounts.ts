import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  parentId: uuid("parent_id"),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
