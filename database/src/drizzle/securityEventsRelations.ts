import { relations } from "drizzle-orm";
import { securityEvents } from "./securityEvents.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [securityEvents.organizationId],
    references: [organizations.id],
  }),
}));
