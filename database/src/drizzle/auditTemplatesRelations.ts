import { relations } from "drizzle-orm";
import { auditTemplates } from "./auditTemplates.js";
import { auditScopes } from "./auditScopes.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

/**
 * Relations for auditTemplates table
 */
export const auditTemplatesRelations = relations(auditTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [auditTemplates.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [auditTemplates.createdBy],
    references: [users.id],
  }),
  auditScopes: many(auditScopes),
}));
