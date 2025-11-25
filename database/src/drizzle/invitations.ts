import { uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { identitySchema, idpk, invitationStatusEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const invitations = identitySchema.table("invitations", {
  id: idpk("id"),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }),
  teamId: uuid("team_id"), // Optional - invite to specific team
  status: invitationStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  inviterId: uuid("inviter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
