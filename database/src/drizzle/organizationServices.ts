import { uuid, timestamp, boolean, index, primaryKey } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { organizations } from "./organizations.js";
import { services } from "./services.js";

// Services enabled for an organization
export const organizationServices = identitySchema.table(
  "organization_services",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade", onUpdate: "cascade" }),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    enabledAt: timestamp("enabled_at", { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.serviceId] }),
    index("org_services_org_id_idx").on(table.organizationId),
    index("org_services_service_id_idx").on(table.serviceId),
    index("org_services_is_enabled_idx").on(table.isEnabled),
  ],
);
