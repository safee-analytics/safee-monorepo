import { varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { idpk, odooSchema } from "./_common.js";
import { organizations } from "./organizations.js";

export const odooDatabases = odooSchema.table("databases", {
  id: idpk("id"),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
    .unique(),
  databaseName: varchar("database_name", { length: 255 }).notNull().unique(),
  adminLogin: varchar("admin_login", { length: 255 }).notNull(),
  adminPassword: varchar("admin_password", { length: 512 }).notNull(),
  odooUrl: varchar("odoo_url", { length: 255 }).notNull(),
  isActive: timestamp("is_active").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
