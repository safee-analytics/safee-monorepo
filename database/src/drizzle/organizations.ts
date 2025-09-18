import { varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";

export const organizations = identitySchema.table("organizations", {
  id: idpk("id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
