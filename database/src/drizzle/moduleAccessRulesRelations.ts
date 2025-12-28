import { relations } from "drizzle-orm";
import { moduleAccessRules } from "./moduleAccessRules.js";
import { organizations } from "./organizations.js";

export const moduleAccessRulesRelations = relations(moduleAccessRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [moduleAccessRules.organizationId],
    references: [organizations.id],
  }),
}));
