import type { ServerContext } from "../../serverContext.js";
import { schema } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound } from "../../errors.js";
import { ApprovalRulesEngine, type EntityData } from "../../services/approval-rules-engine.js";

export interface SubmitForApprovalRequest {
  entityType: string;
  entityId: string;
  entityData: EntityData;
}

export interface SubmitForApprovalResponse {
  requestId: string;
  workflowId: string;
  status: string;
  message: string;
}

export async function submitForApproval(
  ctx: ServerContext,
  organizationId: string,
  userId: string,
  request: SubmitForApprovalRequest,
): Promise<SubmitForApprovalResponse> {
  const logger = pino();

  // Validation: Entity type
  if (!request.entityType || request.entityType.trim().length === 0) {
    throw new InvalidInput("Entity type cannot be empty");
  }

  // Validation: Entity ID
  if (!request.entityId || request.entityId.trim().length === 0) {
    throw new InvalidInput("Entity ID cannot be empty");
  }

  // Validation: Entity data
  if (!request.entityData || Object.keys(request.entityData).length === 0) {
    throw new InvalidInput("Entity data cannot be empty");
  }

  try {
    const rulesEngine = new ApprovalRulesEngine(ctx);

    const match = await rulesEngine.findMatchingWorkflow(organizationId, request.entityData);

    if (!match) {
      throw new NotFound("No matching approval workflow found for this entity");
    }

    const [approvalRequest] = await ctx.drizzle
      .insert(schema.approvalRequests)
      .values({
        workflowId: match.workflowId,
        entityType: request.entityType as never,
        entityId: request.entityId,
        status: "pending",
        requestedBy: userId,
        submittedAt: new Date(),
      })
      .returning();

    const steps = await rulesEngine.getWorkflowSteps(match.workflowId);

    if (steps.length === 0) {
      throw new InvalidInput("Workflow has no steps configured");
    }

    const firstStep = steps[0];
    const { approverIds } = await rulesEngine.getRequiredApprovers(firstStep.id, organizationId);

    if (approverIds.length === 0) {
      throw new InvalidInput("No approvers found for the first workflow step");
    }

    await Promise.all(
      approverIds.map((approverId) =>
        ctx.drizzle.insert(schema.approvalSteps).values({
          requestId: approvalRequest.id,
          stepOrder: firstStep.stepOrder,
          approverId,
          status: "pending",
        }),
      ),
    );

    logger.info(
      {
        requestId: approvalRequest.id,
        workflowId: match.workflowId,
        entityType: request.entityType,
        entityId: request.entityId,
        organizationId,
        userId,
      },
      "Entity submitted for approval successfully",
    );

    return {
      requestId: approvalRequest.id,
      workflowId: match.workflowId,
      status: "pending",
      message: `Entity submitted for approval. Awaiting approval from ${approverIds.length} approver(s).`,
    };
  } catch (err) {
    if (err instanceof InvalidInput || err instanceof NotFound) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, request }, "Failed to submit entity for approval");
    throw new OperationFailed("Failed to submit entity for approval");
  }
}
