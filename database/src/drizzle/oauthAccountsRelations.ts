import { relations } from "drizzle-orm";
import { oauthAccounts } from "./oauthAccounts.js";
import { users } from "./users.js";

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));
