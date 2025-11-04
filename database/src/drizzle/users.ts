import { uuid, varchar, timestamp, boolean, index, text } from "drizzle-orm/pg-core";
import { identitySchema, idpk, localeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const users = identitySchema.table(
  "users",
  {
    id: idpk("id"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    // Password removed - Better Auth stores passwords in oauth_accounts table
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    preferredLocale: localeEnum("preferred_locale").default("en").notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    // Better Auth required fields
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"), // Profile image URL

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_organization_id_idx").on(table.organizationId),
    index("users_is_active_idx").on(table.isActive),
    index("users_email_verified_idx").on(table.emailVerified),
  ],
);
