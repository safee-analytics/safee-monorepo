import { varchar, timestamp, uuid, integer, numeric, boolean } from "drizzle-orm/pg-core";
import {
  hrSchema,
  idpk,
  allocationUnitEnum,
  requestUnitEnum,
  timeTypeEnum,
  validationTypeEnum,
} from "./_common.js";
import { organizations } from "./organizations.js";

export const hrLeaveTypes = hrSchema.table("leave_types", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooLeaveTypeId: integer("odoo_leave_type_id"),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  allocationUnit: allocationUnitEnum("allocation_unit").default("day").notNull(),
  requestUnit: requestUnitEnum("request_unit").default("day").notNull(),
  timeType: timeTypeEnum("time_type").default("leave").notNull(),
  color: integer("color"),

  validationType: validationTypeEnum("validation_type").default("no_validation").notNull(),

  maxLeaves: numeric("max_leaves", { precision: 10, scale: 2 }),
  leavesPerYear: numeric("leaves_per_year", { precision: 10, scale: 2 }),
  unpaid: boolean("unpaid").default(false),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
