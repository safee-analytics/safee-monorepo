import { relations } from "drizzle-orm";
import { loginAttempts } from "./loginAttempts.js";
import { users } from "./users.js";

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));
