import { uuid, varchar, integer, text, boolean, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { casesSchema, idpk, stepTypeEnum } from "./_common.js";
import { workflowTemplates } from "./workflowTemplates.js";
import { approvalWorkflows } from "./approvalWorkflows.js";
import { templates } from "./templates.js";

export const workflowSteps = casesSchema.table(
  "workflow_steps",
  {
    id: idpk("id"),
    workflowTemplateId: uuid("workflow_template_id")
      .references(() => workflowTemplates.id, { onDelete: "cascade" })
      .notNull(),
    stepId: varchar("step_id", { length: 100 }).notNull(),
    stepOrder: integer("step_order").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    stepType: stepTypeEnum("step_type").notNull(),
    config: jsonb("config").default({}).$type<Record<string, unknown>>(),
    conditions: jsonb("conditions").default([]).$type<
      {
        type: string;
        field?: string;
        operator?: string;
        value?: unknown;
      }[]
    >(),
    isRequired: boolean("is_required").notNull().default(true),
    canSkip: boolean("can_skip").notNull().default(false),
    approvalWorkflowId: uuid("approval_workflow_id").references(() => approvalWorkflows.id, {
      onDelete: "set null",
    }),
    templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("workflow_steps_template_step_unique").on(table.workflowTemplateId, table.stepId),
    index("workflow_steps_workflow_template_id_idx").on(table.workflowTemplateId),
    index("workflow_steps_step_order_idx").on(table.stepOrder),
    index("workflow_steps_approval_workflow_id_idx").on(table.approvalWorkflowId),
  ],
);

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type NewWorkflowStep = typeof workflowSteps.$inferInsert;
