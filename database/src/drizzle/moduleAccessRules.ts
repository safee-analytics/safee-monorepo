import { uuid, varchar, boolean, timestamp, text, unique, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const moduleAccessRules = identitySchema.table(
  "module_access_rules",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    // null organizationId = global default

    moduleKey: varchar("module_key", { length: 50 }).notNull(), // 'hisabiq', 'kanz', 'nisbah', 'audit'
    role: varchar("role", { length: 50 }).notNull(), // 'auditor', 'accountant', etc.
    hasAccess: boolean("has_access").default(true).notNull(),
    allowedSections: text("allowed_sections"), // JSON array for HR sections

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.organizationId, table.moduleKey, table.role),
    index("module_access_org_idx").on(table.organizationId),
    index("module_access_module_idx").on(table.moduleKey),
    index("module_access_role_idx").on(table.role),
  ],
);
