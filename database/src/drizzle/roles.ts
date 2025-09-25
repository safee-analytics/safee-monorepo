import { varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";

export const roles = identitySchema.table("roles", {
  id: idpk("id"),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
