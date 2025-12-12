import { text, timestamp, varchar } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";

export const verifications = identitySchema.table("verifications", {
  id: idpk("id"),
  identifier: varchar("identifier", { length: 255 }).notNull(), // email or phone
  value: text("value").notNull(), // verification code/token
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
