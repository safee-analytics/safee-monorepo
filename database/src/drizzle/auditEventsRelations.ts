import { relations } from "drizzle-orm";
import { auditEvents } from "./auditEvents.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditEvents.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
}));
