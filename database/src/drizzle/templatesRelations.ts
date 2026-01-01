import { relations } from "drizzle-orm";
import { templates } from "./templates.js";
import { templateInstances } from "./templateInstances.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const templatesRelations = relations(templates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [templates.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [templates.createdBy],
    references: [users.id],
  }),
  templateInstances: many(templateInstances),
}));
