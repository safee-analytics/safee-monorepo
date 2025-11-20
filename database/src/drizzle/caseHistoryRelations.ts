import { relations } from "drizzle-orm";
import { caseHistory } from "./caseHistory.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

/**
 * Relations for caseHistory table
 */
export const caseHistoryRelations = relations(caseHistory, ({ one }) => ({
  case: one(cases, {
    fields: [caseHistory.caseId],
    references: [cases.id],
  }),
  changer: one(users, {
    fields: [caseHistory.changedBy],
    references: [users.id],
  }),
}));
