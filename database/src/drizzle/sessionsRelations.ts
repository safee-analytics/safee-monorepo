import { relations } from "drizzle-orm";
import { sessions } from "./sessions.js";
import { users } from "./users.js";

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
