import type { DrizzleClient } from "@safee/database";
import { schema, eq, and } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound, InsufficientPermissions } from "../../errors.js";

export interface RejectRequest {
  comments?: string;
}

export interface RejectResponse {
  success: boolean;
  message: string;
  requestStatus?: string;
}

export async function reject(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  requestId: string,
  request: RejectRequest,
): Promise<RejectResponse> {
  const logger = pino();

  try {
    // Get the approval request
    const approvalRequest = await drizzle.query.approvalRequests.findFirst({
      where: eq(schema.approvalRequests.id, requestId),
    });

    if (!approvalRequest) {
      throw new NotFound("Approval request not found");
    }

    if (approvalRequest.status !== "pending") {
      throw new InvalidInput(`Cannot reject request with status: ${approvalRequest.status}`);
    }

    // Find pending approval step for this user
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: and(eq(schema.approvalSteps.requestId, requestId), eq(schema.approvalSteps.status, "pending")),
    });

    if (!approvalStep) {
      throw new NotFound("No pending approval step found for this request");
    }

    // Check if user is the approver or delegated user
    const isApprover = approvalStep.approverId === userId;
    const isDelegated = approvalStep.delegatedTo === userId;

    if (!isApprover && !isDelegated) {
      throw new NotFound("No pending approval step found for this user");
    }

    // Check if user has permission to reject
    const member = await drizzle.query.members.findFirst({
      where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
    });

    if (!member) {
      throw new InsufficientPermissions("User is not a member of this organization");
    }

    // Update approval step
    await drizzle
      .update(schema.approvalSteps)
      .set({
        status: "rejected",
        comments: request.comments || null,
        actionAt: new Date(),
      })
      .where(eq(schema.approvalSteps.id, approvalStep.id));

    // Reject the entire request
    await drizzle
      .update(schema.approvalRequests)
      .set({
        status: "rejected",
        completedAt: new Date(),
      })
      .where(eq(schema.approvalRequests.id, requestId));

    logger.info(
      {
        requestId,
        userId,
        organizationId,
      },
      "Approval request rejected",
    );

    return {
      success: true,
      message: "Approval request rejected.",
      requestStatus: "rejected",
    };
  } catch (error) {
    // Re-throw domain errors as-is
    if (
      error instanceof InvalidInput ||
      error instanceof NotFound ||
      error instanceof InsufficientPermissions
    ) {
      throw error;
    }

    logger.error({ error, organizationId, userId, requestId }, "Failed to reject request");
    throw new OperationFailed("Failed to reject request");
  }
}
