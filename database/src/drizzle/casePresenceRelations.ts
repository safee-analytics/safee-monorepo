import { relations } from "drizzle-orm";
import { casePresence } from "./casePresence.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const casePresenceRelations = relations(casePresence, ({ one }) => ({
  case: one(cases, {
    fields: [casePresence.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [casePresence.userId],
    references: [users.id],
  }),
}));
