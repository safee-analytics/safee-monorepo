import { varchar, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { idpk, odooSchema } from "./_common.js";
import { users } from "./users.js";
import { odooDatabases } from "./odooDatabases.js";

export const odooUsers = odooSchema.table("odoo_users", {
  id: idpk("id"),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooDatabaseId: uuid("odoo_database_id")
    .notNull()
    .references(() => odooDatabases.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooUid: integer("odoo_uid").notNull(),
  odooLogin: varchar("odoo_login", { length: 255 }).notNull(),
  apiKey: varchar("api_key", { length: 512 }),
  password: varchar("password", { length: 512 }).notNull(),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
