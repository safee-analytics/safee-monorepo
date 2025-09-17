import { uuid, varchar, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { financeSchema } from "./_common.js";
import { organizations } from "./organizations.js";
import { contacts } from "./contacts.js";
import { InvoiceType } from "./schema.js";

export const invoices = financeSchema.table("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: varchar("number", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }).$type<InvoiceType>().notNull(),
  date: date("date").notNull(),
  dueDate: date("due_date"),
  customerId: uuid("customer_id").references(() => contacts.id),
  supplierId: uuid("supplier_id").references(() => contacts.id),
  total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
  status: varchar("status", { length: 50 }).default("DRAFT").notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = financeSchema.table("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
