import { uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const users = identitySchema.table(
  "users",
  {
    id: idpk("id"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_organization_id_idx").on(table.organizationId),
    index("users_is_active_idx").on(table.isActive),
  ],
);
