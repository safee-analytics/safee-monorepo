import { uuid, varchar, integer, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { casesSchema, idpk } from "./_common.js";
import { cases } from "./cases.js";
import { workflowTemplates } from "./workflowTemplates.js";

export const workflowInstances = casesSchema.table(
  "workflow_instances",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    workflowTemplateId: uuid("workflow_template_id")
      .references(() => workflowTemplates.id, { onDelete: "restrict" })
      .notNull(),
    currentStepIndex: integer("current_step_index").notNull().default(0),
    currentStepId: varchar("current_step_id", { length: 100 }),
    state: jsonb("state")
      .notNull()
      .$type<{
        completedSteps: string[];
        stepData: Record<string, unknown>;
        variables: Record<string, unknown>;
      }>()
      .default({
        completedSteps: [],
        stepData: {},
        variables: {},
      }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("workflow_instances_case_id_unique").on(table.caseId),
    index("workflow_instances_workflow_template_id_idx").on(table.workflowTemplateId),
    index("workflow_instances_current_step_id_idx").on(table.currentStepId),
  ],
);

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type NewWorkflowInstance = typeof workflowInstances.$inferInsert;
