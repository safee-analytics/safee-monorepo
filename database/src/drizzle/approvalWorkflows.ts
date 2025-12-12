import { uuid, varchar, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { systemSchema, idpk, entityTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const approvalWorkflows = systemSchema.table(
  "approval_workflows",
  {
    id: idpk("id"),
    name: varchar("name", { length: 255 }).notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    entityType: entityTypeEnum("entity_type").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    rules: jsonb("rules"), // JSONB for flexible rule configuration
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("approval_workflows_org_id_idx").on(table.organizationId),
    index("approval_workflows_entity_type_idx").on(table.entityType),
    index("approval_workflows_is_active_idx").on(table.isActive),
  ],
);
