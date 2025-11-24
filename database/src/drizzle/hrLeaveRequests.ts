import { varchar, timestamp, uuid, integer, numeric, date, boolean, text } from "drizzle-orm/pg-core";
import { hrSchema, idpk, leaveStateEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const hrLeaveRequests = hrSchema.table("leave_requests", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooLeaveId: integer("odoo_leave_id"),

  employeeId: uuid("employee_id").notNull(), // Links to hrEmployees
  leaveTypeId: uuid("leave_type_id").notNull(), // Links to hrLeaveTypes
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  numberOfDays: numeric("number_of_days", { precision: 10, scale: 2 }).notNull(),
  state: leaveStateEnum("state").default("draft").notNull(),

  requestDateFrom: timestamp("request_date_from", { withTimezone: true }),
  requestUnitHalf: boolean("request_unit_half").default(false),
  requestUnitHours: boolean("request_unit_hours").default(false),
  requestHourFrom: varchar("request_hour_from", { length: 10 }),
  requestHourTo: varchar("request_hour_to", { length: 10 }),

  notes: text("notes"),
  managerId: uuid("manager_id"),
  departmentId: uuid("department_id"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
