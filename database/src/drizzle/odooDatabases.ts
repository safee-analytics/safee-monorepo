import { varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { organizations } from "./organizations.js";

export const odooDatabases = identitySchema.table("odoo_databases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" })
    .unique(),
  databaseName: varchar("database_name", { length: 255 }).notNull().unique(),
  adminLogin: varchar("admin_login", { length: 255 }).notNull(),
  adminPassword: varchar("admin_password", { length: 512 }).notNull(),
  odooUrl: varchar("odoo_url", { length: 255 }).notNull(),
  isActive: timestamp("is_active").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
