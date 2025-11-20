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

type WorkflowFields = Pick<typeof schema.approvalWorkflows.$inferSelect, "id" | "name">;

type ApprovalRequestsByApproverResult = (typeof schema.approvalSteps.$inferSelect & {
  request: typeof schema.approvalRequests.$inferSelect & {
    workflow: WorkflowFields;
    requestedByUser: UserFields;
    steps: (typeof schema.approvalSteps.$inferSelect & {
      approver: UserFields;
      delegatedToUser: UserFields | null;
    })[];
  };
})[];

export async function getApprovalRequestsByApprover(
  deps: DbDeps,
  approverId: string,
  status?: ApprovalStatus,
): Promise<ApprovalRequestsByApproverResult> {
  const { drizzle } = deps;
  const { approvalSteps } = schema;

  const userColumns = {
    id: true,
    name: true,
    email: true,
  } as const;

  const workflowColumns = {
    id: true,
    name: true,
  } as const;

  const approvalStepsRecords = await drizzle.query.approvalSteps.findMany({
    where: and(
      eq(approvalSteps.approverId, approverId),
      status ? eq(approvalSteps.status, status) : undefined,
    ),
    with: {
      request: {
        with: {
          workflow: {
            columns: workflowColumns,
          },
          requestedByUser: {
            columns: userColumns,
          },
          steps: {
            with: {
              approver: {
                columns: userColumns,
              },
              delegatedToUser: {
                columns: userColumns,
              },
            },
          },
        },
      },
    },
    orderBy: [desc(approvalSteps.actionAt)],
  });

  return approvalStepsRecords;
}

type ApprovalRequestByIdResult =
  | (typeof schema.approvalRequests.$inferSelect & {
      workflow: typeof schema.approvalWorkflows.$inferSelect;
      requestedByUser: UserFields;
      steps: (typeof schema.approvalSteps.$inferSelect & {
        approver: UserFields;
        delegatedToUser: UserFields | null;
      })[];
    })
  | undefined;

export async function getApprovalRequestById(
  deps: DbDeps,
  requestId: string,
): Promise<ApprovalRequestByIdResult> {
  const { drizzle } = deps;
  const { approvalSteps } = schema;

  const userColumns = {
    id: true,
    name: true,
    email: true,
  } as const;

  const request = await drizzle.query.approvalRequests.findFirst({
    where: eq(approvalRequests.id, requestId),
    with: {
      workflow: true,
      requestedByUser: { columns: userColumns },
      steps: {
        with: {
          approver: { columns: userColumns },
          delegatedToUser: { columns: userColumns },
        },
        orderBy: [approvalSteps.stepOrder],
      },
    },
  });

  return request;
}

type UserFields = Pick<typeof schema.users.$inferSelect, "id" | "name" | "email">;

type ApprovalHistoryResult = (typeof schema.approvalRequests.$inferSelect & {
  workflow: typeof schema.approvalWorkflows.$inferSelect;
  requestedByUser: UserFields;
  steps: (typeof schema.approvalSteps.$inferSelect & {
    approver: UserFields;
    delegatedToUser: UserFields | null;
  })[];
})[];

export async function getApprovalHistoryByEntity(
  deps: DbDeps,
  entityType: string,
  entityId: string,
): Promise<ApprovalHistoryResult> {
  const { drizzle } = deps;
  const { approvalSteps } = schema;

  const userColumns = {
    id: true,
    name: true,
    email: true,
  } as const;

  const requests = await drizzle.query.approvalRequests.findMany({
    where: and(eq(approvalRequests.entityType, entityType as never), eq(approvalRequests.entityId, entityId)),
    with: {
      workflow: true,
      requestedByUser: { columns: userColumns },
      steps: {
        with: {
          approver: { columns: userColumns },
          delegatedToUser: { columns: userColumns },
        },
        orderBy: [approvalSteps.stepOrder],
      },
    },
    orderBy: [desc(approvalRequests.submittedAt)],
  });

  return requests;
}
