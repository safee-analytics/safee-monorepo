import { uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { financeSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const accounts = financeSchema.table("accounts", {
  id: idpk("id"),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  parentId: uuid("parent_id"),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("accounts_organization_id_idx").on(table.organizationId),
]);
