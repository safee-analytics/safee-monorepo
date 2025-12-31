import { relations } from "drizzle-orm";
import { auditSections } from "./auditSections.js";
import { templateInstances } from "./templateInstances.js";
import { auditProcedures } from "./auditProcedures.js";

export const auditSectionsRelations = relations(auditSections, ({ one, many }) => ({
  scope: one(templateInstances, {
    fields: [auditSections.scopeId],
    references: [templateInstances.id],
  }),
  procedures: many(auditProcedures),
}));
