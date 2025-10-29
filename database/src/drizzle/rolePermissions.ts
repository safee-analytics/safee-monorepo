import { uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { roles } from "./roles.js";
import { permissions } from "./permissions.js";

export const rolePermissions = identitySchema.table(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);
