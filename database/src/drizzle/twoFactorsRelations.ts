import { relations } from "drizzle-orm";
import { twoFactors } from "./twoFactors.js";
import { users } from "./users.js";

export const twoFactorsRelations = relations(twoFactors, ({ one }) => ({
  user: one(users, {
    fields: [twoFactors.userId],
    references: [users.id],
  }),
}));
