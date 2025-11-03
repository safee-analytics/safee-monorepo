import { varchar, timestamp, boolean, text, pgEnum } from "drizzle-orm/pg-core";
import { systemSchema, idpk } from "./_common.js";

export const serviceTypeEnum = pgEnum("service_type", [
  "accounting",
  "sales",
  "crm",
  "purchase",
  "inventory",
  "mrp",
  "hr",
  "payroll",
  "recruitment",
  "expenses",
  "project",
  "timesheet",
  "website",
  "ecommerce",
  "point_of_sale",
  "marketing",
  "email_marketing",
  "helpdesk",
  "planning",
  "field_service",
]);

export const services = systemSchema.table("services", {
  id: idpk("id"),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  serviceType: serviceTypeEnum("service_type").notNull(),
  icon: varchar("icon", { length: 100 }), // Icon identifier
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: varchar("sort_order", { length: 10 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
