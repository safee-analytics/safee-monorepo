import { relations } from "drizzle-orm";
import { apikeys } from "./apikeys.js";
import { users } from "./users.js";

export const apikeysRelations = relations(apikeys, ({ one }) => ({
  user: one(users, {
    fields: [apikeys.userId],
    references: [users.id],
  }),
}));
