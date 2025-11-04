import { pgTable, text, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { organizations } from "./organizations.js";
import { eventTypeEnum, riskLevelEnum, idpk } from "./_common.js";

export const securityEvents = pgTable("security_events", {
  id: idpk("id"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
  eventType: eventTypeEnum("event_type").notNull(),
  resource: text("resource"), // What was accessed
  action: text("action"), // What action was performed
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  location: text("location"),
  riskLevel: riskLevelEnum("risk_level").notNull().default("low"),
  success: boolean("success").notNull(),
  metadata: jsonb("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
