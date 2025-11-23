import { uuid, timestamp, boolean, index, primaryKey } from "drizzle-orm/pg-core";
import { identitySchema, dataScopeEnum } from "./_common.js";
import { users } from "./users.js";
import { services } from "./services.js";

export const userServices = identitySchema.table(
  "user_services",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade", onUpdate: "cascade" }),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    enabledAt: timestamp("enabled_at", { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),

    dataScope: dataScopeEnum("data_scope").default("own").notNull(),

    departmentId: uuid("department_id"),

    teamId: uuid("team_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.serviceId] }),
    index("user_services_user_id_idx").on(table.userId),
    index("user_services_service_id_idx").on(table.serviceId),
    index("user_services_is_enabled_idx").on(table.isEnabled),
    index("user_services_data_scope_idx").on(table.dataScope),
  ],
);
