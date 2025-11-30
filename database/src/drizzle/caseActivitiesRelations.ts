import { relations } from "drizzle-orm";
import { caseActivities } from "./caseActivities.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const caseActivitiesRelations = relations(caseActivities, ({ one }) => ({
  case: one(cases, {
    fields: [caseActivities.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseActivities.userId],
    references: [users.id],
  }),
}));
