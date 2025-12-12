import { varchar, timestamp, uuid, integer, numeric, date, text } from "drizzle-orm/pg-core";
import { hrSchema, idpk, leaveStateEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const hrLeaveAllocations = hrSchema.table("leave_allocations", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooAllocationId: integer("odoo_allocation_id"),

  employeeId: uuid("employee_id").notNull(), // Links to hrEmployees
  leaveTypeId: uuid("leave_type_id").notNull(), // Links to hrLeaveTypes
  numberOfDays: numeric("number_of_days", { precision: 10, scale: 2 }).notNull(),
  numberOfDaysDisplay: numeric("number_of_days_display", { precision: 10, scale: 2 }),
  dateFrom: date("date_from"),
  dateTo: date("date_to"),
  state: leaveStateEnum("state").default("draft").notNull(),

  name: varchar("name", { length: 255 }),
  notes: text("notes"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
