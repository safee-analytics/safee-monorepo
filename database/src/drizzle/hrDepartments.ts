import { varchar, timestamp, uuid, integer, text, type AnyPgColumn } from "drizzle-orm/pg-core";
import { hrSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const hrDepartments = hrSchema.table("departments", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooDepartmentId: integer("odoo_department_id"),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  managerId: uuid("manager_id"),
  parentId: uuid("parent_id").references((): AnyPgColumn => hrDepartments.id),
  color: integer("color"),
  note: text("note"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
