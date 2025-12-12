import { relations } from "drizzle-orm";
import { subscriptionPlans } from "./subscriptionPlans.js";
import { organizationSubscriptions } from "./organizationSubscriptions.js";

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(organizationSubscriptions),
}));
