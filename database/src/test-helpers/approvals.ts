import type { DrizzleClient } from "../index.js";
import { approvalWorkflows, approvalWorkflowSteps, approvalRules } from "../drizzle/index.js";

export async function createTestApprovalWorkflow(
  db: DrizzleClient,
  organizationId: string,
  approverId: string,
  options?: {
    entityType?: string;
    stepType?: "single" | "parallel" | "any";
    approverType?: "user" | "role" | "team";
    minApprovals?: number;
  },
) {
  const {
    entityType = "invoice",
    stepType = "single",
    approverType = "user",
    minApprovals = 1,
  } = options ?? {};

  const [workflow] = await db
    .insert(approvalWorkflows)
    .values({
      name: "Test Approval Workflow",
      organizationId,
      entityType: entityType as never,
      isActive: true,
      rules: {},
    })
    .returning();

  const [workflowStep] = await db
    .insert(approvalWorkflowSteps)
    .values({
      workflowId: workflow.id,
      stepOrder: 1,
      stepType,
      approverType,
      approverId,
      minApprovals,
      requiredApprovers: minApprovals,
    })
    .returning();

  const [rule] = await db
    .insert(approvalRules)
    .values({
      organizationId,
      entityType: entityType as never,
      ruleName: "Test Rule",
      conditions: {
        conditions: [{ type: "manual" }],
        logic: "AND",
      },
      workflowId: workflow.id,
      priority: 1,
    })
    .returning();

  return { workflow, workflowStep, rule };
}
