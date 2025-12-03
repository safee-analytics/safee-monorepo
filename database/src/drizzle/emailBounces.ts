import { uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { users } from "./users.js";

export const emailBounceTypeEnum = identitySchema.enum("email_bounce_type", [
  "hard",
  "soft",
  "complaint",
  "unsubscribe",
]);

export const emailBounces = identitySchema.table("email_bounces", {
  id: idpk("id"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }).notNull(),
  bounceType: emailBounceTypeEnum("bounce_type").notNull(),
  reason: text("reason"),
  messageId: varchar("message_id", { length: 255 }),
  bounceCount: integer("bounce_count").default(1).notNull(),
  lastBouncedAt: timestamp("last_bounced_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
