import { relations } from "drizzle-orm";
import { organizationSubscriptions } from "./organizationSubscriptions.js";
import { subscriptionPlans } from "./subscriptionPlans.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const organizationSubscriptionsRelations = relations(organizationSubscriptions, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [organizationSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  organization: one(organizations, {
    fields: [organizationSubscriptions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationSubscriptions.userId],
    references: [users.id],
  }),
}));
