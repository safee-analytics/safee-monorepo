import { uuid, varchar, timestamp, boolean, index, text } from "drizzle-orm/pg-core";
import { identitySchema, idpk, localeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const users = identitySchema.table(
  "users",
  {
    id: idpk("id"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    role: varchar("role", { length: 50 }).default("user").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    preferredLocale: localeEnum("preferred_locale").default("en").notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),

    // Profile fields
    phone: varchar("phone", { length: 50 }),
    jobTitle: varchar("job_title", { length: 255 }),
    department: varchar("department", { length: 255 }),
    company: varchar("company", { length: 255 }),
    location: varchar("location", { length: 255 }),
    bio: text("bio"),
    timezone: varchar("timezone", { length: 100 }).default("UTC"),
    dateFormat: varchar("date_format", { length: 50 }).default("DD/MM/YYYY"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_organization_id_idx").on(table.organizationId),
    index("users_is_active_idx").on(table.isActive),
    index("users_email_verified_idx").on(table.emailVerified),
  ],
);
