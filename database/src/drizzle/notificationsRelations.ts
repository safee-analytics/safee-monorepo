import { relations } from "drizzle-orm";
import { notifications } from "./notifications.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));
