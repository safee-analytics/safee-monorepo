import { relations } from "drizzle-orm";
import { auditSections } from "./auditSections.js";
import { auditScopes } from "./auditScopes.js";
import { auditProcedures } from "./auditProcedures.js";

/**
 * Relations for auditSections table
 */
export const auditSectionsRelations = relations(auditSections, ({ one, many }) => ({
  scope: one(auditScopes, {
    fields: [auditSections.scopeId],
    references: [auditScopes.id],
  }),
  procedures: many(auditProcedures),
}));
