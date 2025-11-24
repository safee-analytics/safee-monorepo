import { varchar, timestamp, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { hrSchema, idpk, payslipLineCategoryEnum } from "./_common.js";
import { hrPayslips } from "./hrPayslips.js";

export const hrPayslipLines = hrSchema.table("payslip_lines", {
  id: idpk("id"),

  payslipId: uuid("payslip_id")
    .notNull()
    .references(() => hrPayslips.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooLineId: integer("odoo_line_id"),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  category: payslipLineCategoryEnum("category"),
  sequence: integer("sequence"),

  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1"),
  rate: numeric("rate", { precision: 10, scale: 2 }).default("100"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
