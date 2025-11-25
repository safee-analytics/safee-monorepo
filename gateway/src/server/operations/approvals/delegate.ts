import type { ServerContext } from "../../serverContext.js";
import { schema, eq, and } from "@safee/database";
import { OperationFailed, NotFound } from "../../errors.js";

export interface DelegateRequest {
  delegateToUserId: string;
  comments?: string;
}

export interface DelegateResponse {
  success: boolean;
  message: string;
}

export async function delegate(
  ctx: ServerContext,
  userId: string,
  requestId: string,
  request: DelegateRequest,
): Promise<DelegateResponse> {
  const { drizzle, logger } = ctx;

  try {
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: and(
        eq(schema.approvalSteps.requestId, requestId),
        eq(schema.approvalSteps.approverId, userId),
        eq(schema.approvalSteps.status, "pending"),
      ),
    });

    if (!approvalStep) {
      throw new NotFound("No pending approval step found for this user");
    }

    await drizzle
      .update(schema.approvalSteps)
      .set({
        delegatedTo: request.delegateToUserId,
        comments: request.comments || null,
      })
      .where(eq(schema.approvalSteps.id, approvalStep.id));

    logger.info(
      {
        requestId,
        userId,
        delegateToUserId: request.delegateToUserId,
      },
      "Approval delegated successfully",
    );

    return {
      success: true,
      message: "Approval delegated successfully.",
    };
  } catch (error) {
    if (error instanceof NotFound) {
      throw error;
    }

    logger.error({ error, userId, requestId }, "Failed to delegate approval");
    throw new OperationFailed("Failed to delegate approval");
  }
}
