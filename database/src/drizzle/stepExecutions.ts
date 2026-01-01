import { uuid, varchar, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { casesSchema, idpk, stepStatusEnum } from "./_common.js";
import { cases } from "./cases.js";
import { workflowInstances } from "./workflowInstances.js";
import { workflowSteps } from "./workflowSteps.js";
import { approvalRequests } from "./approvalRequests.js";
import { users } from "./users.js";

export const stepExecutions = casesSchema.table(
  "step_executions",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    workflowInstanceId: uuid("workflow_instance_id")
      .references(() => workflowInstances.id, { onDelete: "cascade" })
      .notNull(),
    workflowStepId: uuid("workflow_step_id").references(() => workflowSteps.id, { onDelete: "restrict" }),
    stepId: varchar("step_id", { length: 100 }).notNull(),
    status: stepStatusEnum("status").notNull().default("pending"),
    data: jsonb("data").default({}).$type<Record<string, unknown>>(),
    approvalRequestId: uuid("approval_request_id").references(() => approvalRequests.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("step_executions_case_step_unique").on(table.caseId, table.stepId),
    index("step_executions_case_id_idx").on(table.caseId),
    index("step_executions_workflow_instance_id_idx").on(table.workflowInstanceId),
    index("step_executions_workflow_step_id_idx").on(table.workflowStepId),
    index("step_executions_status_idx").on(table.status),
    index("step_executions_approval_request_id_idx").on(table.approvalRequestId),
  ],
);

export type StepExecution = typeof stepExecutions.$inferSelect;
export type NewStepExecution = typeof stepExecutions.$inferInsert;
