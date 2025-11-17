import type { DrizzleClient } from "@safee/database";
import { schema, eq, and } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound, InsufficientPermissions } from "../../errors.js";
import { ApprovalRulesEngine } from "../../services/approval-rules-engine.js";

export interface ApproveRequest {
  comments?: string;
}

export interface ApproveResponse {
  success: boolean;
  message: string;
  requestStatus?: string;
}

export async function approve(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  requestId: string,
  request: ApproveRequest,
): Promise<ApproveResponse> {
  const logger = pino();

  try {
    const approvalRequest = await drizzle.query.approvalRequests.findFirst({
      where: eq(schema.approvalRequests.id, requestId),
      with: {
        workflow: {
          with: {
            steps: true,
          },
        },
      },
    });

    if (!approvalRequest) {
      throw new NotFound("Approval request not found");
    }

    if (approvalRequest.status !== "pending") {
      throw new InvalidInput(`Cannot approve request with status: ${approvalRequest.status}`);
    }

    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: and(eq(schema.approvalSteps.requestId, requestId), eq(schema.approvalSteps.status, "pending")),
    });

    if (!approvalStep) {
      throw new NotFound("No pending approval step found for this request");
    }

    const isApprover = approvalStep.approverId === userId;
    const isDelegated = approvalStep.delegatedTo === userId;

    if (!isApprover && !isDelegated) {
      throw new NotFound("No pending approval step found for this user");
    }

    const member = await drizzle.query.members.findFirst({
      where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
    });

    if (!member) {
      throw new InsufficientPermissions("User is not a member of this organization");
    }

    await drizzle
      .update(schema.approvalSteps)
      .set({
        status: "approved",
        comments: request.comments || null,
        actionAt: new Date(),
      })
      .where(eq(schema.approvalSteps.id, approvalStep.id));

    const rulesEngine = new ApprovalRulesEngine(drizzle);
    const stepComplete = await rulesEngine.isStepComplete(requestId, approvalStep.stepOrder);

    if (stepComplete) {
      const nextStep = await rulesEngine.getNextStep(requestId, approvalStep.stepOrder);

      if (nextStep) {
        const { approverIds } = await rulesEngine.getRequiredApprovers(nextStep.id, organizationId);

        await Promise.all(
          approverIds.map((approverId) =>
            drizzle.insert(schema.approvalSteps).values({
              requestId: approvalRequest.id,
              stepOrder: nextStep.stepOrder,
              approverId,
              status: "pending",
            }),
          ),
        );

        logger.info(
          {
            requestId,
            userId,
            organizationId,
            nextStepOrder: nextStep.stepOrder,
          },
          "Approval recorded. Moving to next step",
        );

        return {
          success: true,
          message: `Approval recorded. Moving to next step (${nextStep.stepOrder}).`,
          requestStatus: "pending",
        };
      } else {
        await drizzle
          .update(schema.approvalRequests)
          .set({
            status: "approved",
            completedAt: new Date(),
          })
          .where(eq(schema.approvalRequests.id, requestId));

        logger.info(
          {
            requestId,
            userId,
            organizationId,
          },
          "Approval completed. All workflow steps approved",
        );

        return {
          success: true,
          message: "Approval completed. All workflow steps approved.",
          requestStatus: "approved",
        };
      }
    }

    logger.info(
      {
        requestId,
        userId,
        organizationId,
        stepOrder: approvalStep.stepOrder,
      },
      "Approval recorded. Awaiting additional approvals for this step",
    );

    return {
      success: true,
      message: "Approval recorded. Awaiting additional approvals for this step.",
      requestStatus: "pending",
    };
  } catch (error) {
    if (
      error instanceof InvalidInput ||
      error instanceof NotFound ||
      error instanceof InsufficientPermissions
    ) {
      throw error;
    }

    logger.error({ error, organizationId, userId, requestId }, "Failed to approve request");
    throw new OperationFailed("Failed to approve request");
  }
}
