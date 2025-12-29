import { varchar, timestamp, uuid, text } from "drizzle-orm/pg-core";
import { idpk, odooSchema } from "./_common.js";
import { organizations } from "./organizations.js";

export const provisioningStatusEnum = odooSchema.enum("provisioning_status", [
  "pending",
  "provisioning",
  "active",
  "failed",
]);

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
  provisioningStatus: provisioningStatusEnum("provisioning_status").notNull().default("pending"),
  provisioningError: text("provisioning_error"),
  provisioningStartedAt: timestamp("provisioning_started_at", { withTimezone: true }),
  provisioningCompletedAt: timestamp("provisioning_completed_at", { withTimezone: true }),
  isActive: timestamp("is_active").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
