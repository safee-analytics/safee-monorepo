import { varchar, timestamp, boolean, index, text } from "drizzle-orm/pg-core";
import { identitySchema, idpk, localeEnum } from "./_common.js";

export const users = identitySchema.table(
  "users",
  {
    id: idpk("id"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    role: varchar("role", { length: 50 }).default("user"),
    preferredLocale: localeEnum("preferred_locale").default("en").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
    username: varchar("username", { length: 255 }).unique(),
    displayUsername: varchar("display_username", { length: 255 }),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    phoneNumber: varchar("phone_number", { length: 50 }).unique(),
    phoneNumberVerified: boolean("phone_number_verified"),
    lastLoginMethod: text("last_login_method"),
    bio: text("bio"),
    timezone: varchar("timezone", { length: 100 }).default("UTC"),
    dateFormat: varchar("date_format", { length: 50 }).default("DD/MM/YYYY"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("users_is_active_idx").on(table.isActive),
    index("users_email_verified_idx").on(table.emailVerified),
    index("users_username_idx").on(table.username),
    index("users_deleted_at_idx").on(table.deletedAt),
  ],
);
