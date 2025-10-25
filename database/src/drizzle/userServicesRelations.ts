import { relations } from "drizzle-orm";
import { userServices } from "./userServices.js";
import { users } from "./users.js";
import { services } from "./services.js";

export const userServicesRelations = relations(userServices, ({ one }) => ({
  user: one(users, {
    fields: [userServices.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [userServices.serviceId],
    references: [services.id],
  }),
}));
