import { varchar, timestamp, boolean, text, uuid } from "drizzle-orm/pg-core";
import { identitySchema, idpk, localeEnum } from "./_common.js";

export const organizations = identitySchema.table("organizations", {
  id: idpk("id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  defaultLocale: localeEnum("default_locale").default("en").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  encryptionEnabled: boolean("encryption_enabled").default(false).notNull(),
  encryptionEnabledAt: timestamp("encryption_enabled_at", { withTimezone: true }),
  encryptionEnabledBy: uuid("encryption_enabled_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => /* @__PURE__ */ new Date()),
});
