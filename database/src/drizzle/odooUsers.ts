import { varchar, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { users } from "./users.js";
import { odooDatabases } from "./odooDatabases.js";

/**
 * Maps Safee users to their corresponding Odoo user accounts
 * Each Safee user gets their own Odoo user in their organization's database
 */
export const odooUsers = identitySchema.table("odoo_users", {
  id: uuid("id").primaryKey().defaultRandom(),

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
  odooPassword: varchar("odoo_password", { length: 512 }).notNull(), // Encrypted

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Usage Example:
 *
 * When user john@acme.com is added to organization "acme-corp":
 * 1. Create Odoo user in database "odoo_acme_corp"
 * 2. Store mapping in odoo_users table
 * 3. Use john's specific Odoo UID for all API calls
 *
 * Benefits:
 * - Odoo audit logs show real user (john@acme.com, not admin)
 * - Can use Odoo permissions (john sees only his CRM opportunities)
 * - Sales attribution works (john's invoices tracked separately)
 * - Compliance requirements met (user-level audit trail)
 */
