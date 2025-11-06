import { uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const organizationRoles = identitySchema.table(
  "organization_roles",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    role: varchar("role", { length: 100 }).notNull(),
    permission: varchar("permission", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("organization_roles_org_id_idx").on(table.organizationId),
    index("organization_roles_role_idx").on(table.role),
  ],
);
