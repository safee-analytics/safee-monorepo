import { uuid, timestamp, index } from "drizzle-orm/pg-core";
import { systemSchema, idpk, entityTypeEnum, approvalStatusEnum } from "./_common.js";
import { approvalWorkflows } from "./approvalWorkflows.js";
import { users } from "./users.js";

export const approvalRequests = systemSchema.table(
  "approval_requests",
  {
    id: idpk("id"),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => approvalWorkflows.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    status: approvalStatusEnum("status").default("pending").notNull(),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("approval_requests_workflow_id_idx").on(table.workflowId),
    index("approval_requests_entity_idx").on(table.entityType, table.entityId),
    index("approval_requests_status_idx").on(table.status),
    index("approval_requests_requested_by_idx").on(table.requestedBy),
  ],
);
