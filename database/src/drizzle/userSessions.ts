import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { loginMethodEnum, revokedReasonEnum, idpk } from "./_common.js";

export const userSessions = pgTable("user_sessions", {
  id: idpk("id"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  deviceFingerprint: text("device_fingerprint").notNull(),
  deviceName: text("device_name"),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  location: text("location"), // City, Country from IP
  loginMethod: loginMethodEnum("login_method").notNull().default("password"),
  isActive: boolean("is_active").notNull().default(true),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  revokedReason: revokedReasonEnum("revoked_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
