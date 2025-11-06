import { relations } from "drizzle-orm";
import { organizationRoles } from "./organizationRoles.js";
import { organizations } from "./organizations.js";

export const organizationRolesRelations = relations(organizationRoles, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationRoles.organizationId],
    references: [organizations.id],
  }),
}));
