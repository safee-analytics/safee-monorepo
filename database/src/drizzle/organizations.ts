import { varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { identitySchema, idpk, localeEnum } from "./_common.js";

export const organizations = identitySchema.table("organizations", {
  id: idpk("id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  defaultLocale: localeEnum("default_locale").default("en").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
