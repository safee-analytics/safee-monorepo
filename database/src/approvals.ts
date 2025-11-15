import type { ApprovalStatus } from "./drizzle/_common.js";
import { schema, eq, and, desc, DbDeps } from "./index.js";
import { z } from "zod";

const { approvalRequests } = schema;

export const ruleConditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("amount"),
    operator: z.enum(["gt", "gte", "lt", "lte", "eq", "neq"]),
    value: z.number(),
  }),
  z.object({
    type: z.literal("entityType"),
    operator: z.literal("eq").optional(),
    value: z.string(),
  }),
  z.object({
    type: z.literal("userRole"),
    operator: z.literal("eq").optional(),
    value: z.string(),
  }),
  z.object({
    type: z.literal("manual"),
  }),
  z.object({
    type: z.literal("field"),
    field: z.string(),
    operator: z.enum(["gt", "gte", "lt", "lte", "eq", "neq", "contains"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
]);

export const ruleSchema = z.object({
  conditions: z.array(ruleConditionSchema),
  logic: z.enum(["AND", "OR"]).optional().default("AND"),
});

// Workflow-level configuration and rules
export const workflowRulesSchema = z
  .object({
    autoApprove: z.boolean().optional(), // Auto-approve if conditions met
    requireComments: z.boolean().optional(), // Require comments on approval/rejection
    allowReassignment: z.boolean().optional(), // Allow reassigning approvers
    timeoutHours: z.number().positive().optional(), // Hours before escalation
    escalationUserIds: z.array(z.uuid()).optional(), // Users to escalate to on timeout
    notifyOnSubmit: z.boolean().optional(), // Notify approvers on submission
    notifyOnComplete: z.boolean().optional(), // Notify requester on completion
  })
  .optional();

export type RuleCondition = z.infer<typeof ruleConditionSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type WorkflowRules = z.infer<typeof workflowRulesSchema>;

export async function getApprovalRequestsByApprover(
  deps: DbDeps,
  approverId: string,
  status?: ApprovalStatus,
) {
  const { drizzle } = deps;
  const { approvalSteps } = schema;

  const approvalStepsRecords = await drizzle.query.approvalSteps.findMany({
    where: and(
      eq(approvalSteps.approverId, approverId),
      status ? eq(approvalSteps.status, status) : undefined,
    ),
    with: {
      request: {
        with: {
          workflow: true,
          requestedByUser: true,
          steps: {
            with: {
              approver: true,
              delegatedToUser: true,
            },
          },
        },
      },
    },
    orderBy: [desc(approvalSteps.actionAt)],
  });

  return approvalStepsRecords;
}

export async function getApprovalRequestById(deps: DbDeps, requestId: string) {
  const { drizzle } = deps;
  const { approvalSteps } = schema;

  const request = await drizzle.query.approvalRequests.findFirst({
    where: eq(approvalRequests.id, requestId),
    with: {
      workflow: true,
      requestedByUser: true,
      steps: {
        with: {
          approver: true,
          delegatedToUser: true,
        },
        orderBy: [approvalSteps.stepOrder],
      },
    },
  });

  return request;
}

export async function getApprovalHistoryByEntity(deps: DbDeps, entityType: string, entityId: string) {
  const { drizzle } = deps;
  const { approvalSteps } = schema;

  const requests = await drizzle.query.approvalRequests.findMany({
    where: and(eq(approvalRequests.entityType, entityType as never), eq(approvalRequests.entityId, entityId)),
    with: {
      workflow: true,
      requestedByUser: true,
      steps: {
        with: {
          approver: true,
          delegatedToUser: true,
        },
        orderBy: [approvalSteps.stepOrder],
      },
    },
    orderBy: [desc(approvalRequests.submittedAt)],
  });

  return requests;
}
