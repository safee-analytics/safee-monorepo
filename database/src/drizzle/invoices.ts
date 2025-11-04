import { uuid, varchar, timestamp, decimal, date, index } from "drizzle-orm/pg-core";
import { financeSchema, invoiceTypeEnum, idpk } from "./_common.js";
import { organizations } from "./organizations.js";
import { contacts } from "./contacts.js";

export const invoices = financeSchema.table(
  "invoices",
  {
    id: idpk("id"),
    number: varchar("number", { length: 100 }).notNull().unique(),
    type: invoiceTypeEnum("type").notNull(),
    date: date("date").notNull(),
    dueDate: date("due_date"),
    customerId: uuid("customer_id").references(() => contacts.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    supplierId: uuid("supplier_id").references(() => contacts.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
    status: varchar("status", { length: 50 }).default("DRAFT").notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("invoices_organization_id_idx").on(table.organizationId)],
);

export const invoiceItems = financeSchema.table(
  "invoice_items",
  {
    id: idpk("id"),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    descriptionEn: varchar("description_en", { length: 255 }).notNull(),
    descriptionAr: varchar("description_ar", { length: 255 }),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("invoice_items_invoice_id_idx").on(table.invoiceId)],
);
