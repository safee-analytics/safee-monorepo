import { uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { users } from "./users.js";
import { roles } from "./roles.js";

export const userRoles = identitySchema.table(
  "user_roles",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);
