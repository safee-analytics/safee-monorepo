import { text, uuid } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { users } from "./users.js";

// Better Auth two-factor authentication table
export const twoFactors = identitySchema.table("two_factors", {
  id: idpk("id"),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export type TwoFactor = typeof twoFactors.$inferSelect;
export type NewTwoFactor = typeof twoFactors.$inferInsert;
