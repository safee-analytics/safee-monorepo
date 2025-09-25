import { relations } from "drizzle-orm";
import { userSessions } from "./userSessions.js";
import { users } from "./users.js";

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));
