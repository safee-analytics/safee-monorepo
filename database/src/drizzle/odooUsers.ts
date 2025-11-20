import { varchar, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { idpk, odooSchema } from "./_common.js";
import { users } from "./users.js";
import { odooDatabases } from "./odooDatabases.js";

export const odooUsers = odooSchema.table("odoo_users", {
  id: idpk("id"),

  // Link to Safee user
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),

  // Link to Odoo database
  odooDatabaseId: uuid("odoo_database_id")
    .notNull()
    .references(() => odooDatabases.id, { onDelete: "cascade", onUpdate: "cascade" }),

  // Odoo user details
  odooUid: integer("odoo_uid").notNull(), // Odoo's internal user ID
  odooLogin: varchar("odoo_login", { length: 255 }).notNull(), // Usually email
  apiKey: varchar("api_key", { length: 512 }), // Encrypted API key for RPC operations (preferred, try first)
  password: varchar("password", { length: 512 }).notNull(), // Encrypted password (fallback if API key unavailable)

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
