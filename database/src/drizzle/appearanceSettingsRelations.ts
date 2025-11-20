import { relations } from "drizzle-orm";
import { appearanceSettings } from "./appearanceSettings.js";
import { users } from "./users.js";

export const appearanceSettingsRelations = relations(appearanceSettings, ({ one }) => ({
  user: one(users, {
    fields: [appearanceSettings.userId],
    references: [users.id],
  }),
}));
