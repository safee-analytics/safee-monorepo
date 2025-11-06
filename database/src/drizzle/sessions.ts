import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { users } from "./users.js";

// Better Auth sessions table
export const sessions = identitySchema.table("sessions", {
  id: idpk("id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),

  // Better-Auth organization plugin fields
  activeOrganizationId: uuid("active_organization_id"),

  // Better-Auth teams plugin fields
  activeTeamId: uuid("active_team_id"),

  // Better-Auth admin plugin fields (impersonation)
  impersonatedBy: uuid("impersonated_by"),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
