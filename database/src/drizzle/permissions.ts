import { varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { identitySchema, idpk, permissionActionEnum, permissionResourceEnum } from "./_common.js";

export const permissions = identitySchema.table("permissions", {
  id: idpk("id"),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  resource: permissionResourceEnum("resource").notNull(),
  action: permissionActionEnum("action").notNull(),
  isSystemPermission: boolean("is_system_permission").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
