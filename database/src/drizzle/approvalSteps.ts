import { uuid, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { systemSchema, idpk } from "./_common.js";
import { approvalRequests, approvalStatusEnum } from "./approvalRequests.js";
import { users } from "./users.js";

export const approvalSteps = systemSchema.table(
  "approval_steps",
  {
    id: idpk("id"),
    requestId: uuid("request_id")
      .notNull()
      .references(() => approvalRequests.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    stepOrder: integer("step_order").notNull(),
    approverId: uuid("approver_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    status: approvalStatusEnum("status").default("pending").notNull(),
    comments: text("comments"),
    actionAt: timestamp("action_at", { withTimezone: true }),
    delegatedTo: uuid("delegated_to").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (table) => [
    index("approval_steps_request_id_idx").on(table.requestId),
    index("approval_steps_approver_id_idx").on(table.approverId),
    index("approval_steps_status_idx").on(table.status),
    index("approval_steps_delegated_to_idx").on(table.delegatedTo),
  ],
);
