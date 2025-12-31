import { relations } from "drizzle-orm";
import { templateInstances } from "./templateInstances.js";
import { auditSections } from "./auditSections.js";
import { templates } from "./templates.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const templateInstancesRelations = relations(templateInstances, ({ one, many }) => ({
  case: one(cases, {
    fields: [templateInstances.caseId],
    references: [cases.id],
  }),
  template: one(templates, {
    fields: [templateInstances.templateId],
    references: [templates.id],
  }),
  creator: one(users, {
    fields: [templateInstances.createdBy],
    references: [users.id],
    relationName: "templateInstanceCreator",
  }),
  completor: one(users, {
    fields: [templateInstances.completedBy],
    references: [users.id],
    relationName: "templateInstanceCompletor",
  }),
  archiver: one(users, {
    fields: [templateInstances.archivedBy],
    references: [users.id],
    relationName: "templateInstanceArchiver",
  }),
  sections: many(auditSections),
}));
