import { varchar, timestamp, uuid, integer, numeric, date, text } from "drizzle-orm/pg-core";
import { hrSchema, idpk, contractStateEnum, wageTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const hrContracts = hrSchema.table("contracts", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooContractId: integer("odoo_contract_id"),

  name: varchar("name", { length: 255 }).notNull(),
  employeeId: uuid("employee_id").notNull(),
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end"),
  state: contractStateEnum("state").default("draft").notNull(),

  jobId: integer("job_id"), // Job position from Odoo
  jobTitle: varchar("job_title", { length: 255 }),
  departmentId: uuid("department_id"),

  wage: numeric("wage", { precision: 15, scale: 2 }).notNull(),
  wageType: wageTypeEnum("wage_type").default("monthly").notNull(),
  structId: integer("struct_id"), // Salary structure from Odoo
  workingScheduleId: integer("working_schedule_id"),

  notes: text("notes"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
