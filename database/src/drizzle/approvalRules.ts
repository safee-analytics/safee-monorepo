import { uuid, varchar, jsonb, integer, index } from "drizzle-orm/pg-core";
import { systemSchema, idpk, entityTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { approvalWorkflows } from "./approvalWorkflows.js";

export const approvalRules = systemSchema.table(
  "approval_rules",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    entityType: entityTypeEnum("entity_type").notNull(),
    ruleName: varchar("rule_name", { length: 255 }).notNull(),
    conditions: jsonb("conditions").notNull(), // JSONB for flexible conditions (amount/type/role)
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => approvalWorkflows.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    priority: integer("priority").default(0).notNull(), // Higher priority = evaluated first
  },
  (table) => [
    index("approval_rules_org_id_idx").on(table.organizationId),
    index("approval_rules_entity_type_idx").on(table.entityType),
    index("approval_rules_workflow_id_idx").on(table.workflowId),
    index("approval_rules_priority_idx").on(table.priority),
  ],
);
