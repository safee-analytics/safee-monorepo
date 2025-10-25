import { varchar, timestamp, boolean, text, pgEnum } from "drizzle-orm/pg-core";
import { systemSchema, idpk } from "./_common.js";

// Odoo service/app types
export const serviceTypeEnum = pgEnum("service_type", [
  "accounting", // Account / Invoicing
  "sales", // Sales
  "crm", // CRM
  "purchase", // Purchase
  "inventory", // Inventory
  "mrp", // Manufacturing
  "hr", // Human Resources
  "payroll", // Payroll
  "recruitment", // Recruitment
  "expenses", // Expenses
  "project", // Project Management
  "timesheet", // Timesheets
  "website", // Website Builder
  "ecommerce", // eCommerce
  "point_of_sale", // Point of Sale
  "marketing", // Marketing Automation
  "email_marketing", // Email Marketing
  "helpdesk", // Helpdesk
  "planning", // Planning
  "field_service", // Field Service
]);

export const services = systemSchema.table("services", {
  id: idpk("id"),
  name: varchar("name", { length: 100 }).notNull().unique(), // Unique identifier
  displayName: varchar("display_name", { length: 255 }).notNull(), // Display name
  description: text("description"),
  serviceType: serviceTypeEnum("service_type").notNull(),
  icon: varchar("icon", { length: 100 }), // Icon identifier
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: varchar("sort_order", { length: 10 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
