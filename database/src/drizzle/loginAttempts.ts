import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { identifierTypeEnum, idpk } from "./_common.js";

export const loginAttempts = pgTable("login_attempts", {
  id: idpk("id"),
  identifier: text("identifier").notNull(), // email or IP
  identifierType: identifierTypeEnum("identifier_type").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  riskScore: integer("risk_score").default(0),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
