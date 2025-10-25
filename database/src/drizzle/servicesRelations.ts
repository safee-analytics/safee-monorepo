import { relations } from "drizzle-orm";
import { services } from "./services.js";
import { organizationServices } from "./organizationServices.js";
import { userServices } from "./userServices.js";

export const servicesRelations = relations(services, ({ many }) => ({
  organizationServices: many(organizationServices),
  userServices: many(userServices),
}));
