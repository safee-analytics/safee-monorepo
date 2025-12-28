import { uuid, varchar, timestamp, unique, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const resourceTypeEnum = identitySchema.enum("resource_type", [
  "audit_case",
  "accounting_client",
  "crm_lead",
  "crm_deal",
  "hr_department",
]);

export const resourceAssignments = identitySchema.table(
  "resource_assignments",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    resourceType: resourceTypeEnum("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    role: varchar("role", { length: 50 }), // 'lead', 'reviewer', 'team_member'

    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.userId, table.resourceType, table.resourceId),
    index("resource_assignments_user_idx").on(table.userId),
    index("resource_assignments_resource_idx").on(table.resourceType, table.resourceId),
    index("resource_assignments_org_idx").on(table.organizationId),
  ]
);
