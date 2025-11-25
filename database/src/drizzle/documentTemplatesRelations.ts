import { relations } from "drizzle-orm";
import { documentTemplates } from "./documentTemplates.js";
import { organizations } from "./organizations.js";

export const documentTemplatesRelations = relations(documentTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [documentTemplates.organizationId],
    references: [organizations.id],
  }),
}));
