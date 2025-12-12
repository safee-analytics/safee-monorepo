import { varchar, timestamp, uuid, integer, numeric, date, boolean } from "drizzle-orm/pg-core";
import { hrSchema, idpk, payslipStateEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const hrPayslips = hrSchema.table("payslips", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooPayslipId: integer("odoo_payslip_id"),

  number: varchar("number", { length: 100 }).notNull(),
  employeeId: uuid("employee_id").notNull(), // Links to hrEmployees
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  state: payslipStateEnum("state").default("draft").notNull(),

  basicWage: numeric("basic_wage", { precision: 15, scale: 2 }),
  netWage: numeric("net_wage", { precision: 15, scale: 2 }),
  grossWage: numeric("gross_wage", { precision: 15, scale: 2 }),

  contractId: uuid("contract_id"), // Links to hrContracts
  structId: integer("struct_id"), // Salary structure from Odoo
  creditNote: boolean("credit_note").default(false),
  paidDate: date("paid_date"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
