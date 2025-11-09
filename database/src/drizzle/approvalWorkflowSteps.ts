import { uuid, integer, index } from "drizzle-orm/pg-core";
import { systemSchema, idpk } from "./_common.js";
import { approvalWorkflows } from "./approvalWorkflows.js";

export const stepTypeEnum = systemSchema.enum("step_type", ["single", "parallel", "any"]);
export const approverTypeEnum = systemSchema.enum("approver_type", ["role", "team", "user"]);

export type StepType = (typeof stepTypeEnum.enumValues)[number];
export type ApproverType = (typeof approverTypeEnum.enumValues)[number];

export const approvalWorkflowSteps = systemSchema.table(
  "approval_workflow_steps",
  {
    id: idpk("id"),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => approvalWorkflows.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    stepOrder: integer("step_order").notNull(),
    stepType: stepTypeEnum("step_type").default("single").notNull(),
    approverType: approverTypeEnum("approver_type").notNull(),
    approverId: uuid("approver_id"), // Could be teamId, roleId, or userId depending on approverType
    minApprovals: integer("min_approvals").default(1).notNull(), // For parallel approval type
    requiredApprovers: integer("required_approvers").default(1).notNull(),
  },
  (table) => [
    index("approval_workflow_steps_workflow_id_idx").on(table.workflowId),
    index("approval_workflow_steps_step_order_idx").on(table.stepOrder),
  ],
);
