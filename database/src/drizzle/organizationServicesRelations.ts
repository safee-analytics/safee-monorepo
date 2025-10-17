import { relations } from "drizzle-orm";
import { organizationServices } from "./organizationServices.js";
import { organizations } from "./organizations.js";
import { services } from "./services.js";

export const organizationServicesRelations = relations(organizationServices, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationServices.organizationId],
    references: [organizations.id],
  }),
  service: one(services, {
    fields: [organizationServices.serviceId],
    references: [services.id],
  }),
}));
