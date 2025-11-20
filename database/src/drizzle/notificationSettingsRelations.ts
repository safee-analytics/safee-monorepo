import { relations } from "drizzle-orm";
import { notificationSettings } from "./notificationSettings.js";
import { users } from "./users.js";

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));
