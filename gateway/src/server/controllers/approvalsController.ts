import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Security,
  Query,
  Body,
  Path,
  SuccessResponse,
  Request,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext } from "../serverContext.js";
import { ApprovalRulesEngine, type EntityData } from "../services/approval-rules-engine.js";
import { schema } from "@safee/database";
import { eq, and, or, desc } from "drizzle-orm";
import { canApprove } from "../middleware/permissions.js";

interface SubmitForApprovalRequest {
  entityType: string;
  entityId: string;
  entityData: EntityData;
}

interface SubmitForApprovalResponse {
  requestId: string;
  workflowId: string;
  status: string;
  message: string;
}

interface ApprovalActionRequest {
  comments?: string;
}

interface DelegateApprovalRequest {
  delegateToUserId: string;
  comments?: string;
}

interface ApprovalActionResponse {
  success: boolean;
  message: string;
  requestStatus?: string;
}

interface ApprovalRequestResponse {
  id: string;
  workflowId: string;
  workflowName: string;
  entityType: string;
  entityId: string;
  status: string;
  requestedBy: string;
  requestedByName?: string;
  submittedAt: string;
  completedAt?: string;
  currentStep?: number;
  totalSteps?: number;
  steps: ApprovalStepResponse[];
}

interface ApprovalStepResponse {
  id: string;
  stepOrder: number;
  approverId: string;
  approverName?: string;
  status: string;
  comments?: string;
  actionAt?: string;
  delegatedTo?: string;
  delegatedToName?: string;
}

@Route("approvals")
@Tags("Approvals")
export class ApprovalsController extends Controller {
  /**
   * Submit an entity for approval
   */
  @Post("/submit")
  @Security("jwt")
  @SuccessResponse("201", "Entity submitted for approval")
  public async submitForApproval(
    @Request() req: AuthenticatedRequest,
    @Body() request: SubmitForApprovalRequest,
  ): Promise<SubmitForApprovalResponse> {
    const ctx = getServerContext();
    const userId = req.betterAuthSession?.user.id || "";
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";

    const rulesEngine = new ApprovalRulesEngine(ctx.drizzle);

    // Find matching workflow
    const match = await rulesEngine.findMatchingWorkflow(organizationId, request.entityData);

    if (!match) {
      throw new Error("No matching approval workflow found for this entity");
    }

    // Create approval request
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

    // Get workflow steps
    const steps = await rulesEngine.getWorkflowSteps(match.workflowId);

    if (steps.length === 0) {
      throw new Error("Workflow has no steps configured");
    }

    // Create approval steps for the first workflow step
    const firstStep = steps[0];
    const { approverIds } = await rulesEngine.getRequiredApprovers(firstStep.id, organizationId);

    // Create an approval step for each approver
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

    this.setStatus(201);

    return {
      requestId: approvalRequest.id,
      workflowId: match.workflowId,
      status: "pending",
      message: `Entity submitted for approval. Awaiting approval from ${approverIds.length} approver(s).`,
    };
  }

  /**
   * Get pending approvals for current user
   */
  @Get("/")
  @Security("jwt")
  public async getPendingApprovals(
    @Request() req: AuthenticatedRequest,
    @Query() status?: "pending" | "approved" | "rejected" | "cancelled",
  ): Promise<ApprovalRequestResponse[]> {
    const ctx = getServerContext();
    const userId = req.betterAuthSession?.user.id || "";

    // Find approval steps assigned to this user
    const approvalSteps = await ctx.drizzle.query.approvalSteps.findMany({
      where: and(
        eq(schema.approvalSteps.approverId, userId),
        status ? eq(schema.approvalSteps.status, status as never) : undefined,
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
      orderBy: [desc(schema.approvalSteps.actionAt)],
    });

    // Transform to response format
    return approvalSteps.map((step) => ({
      id: step.request.id,
      workflowId: step.request.workflowId,
      workflowName: step.request.workflow.name,
      entityType: step.request.entityType,
      entityId: step.request.entityId,
      status: step.request.status,
      requestedBy: step.request.requestedBy,
      requestedByName: step.request.requestedByUser?.name || undefined,
      submittedAt: step.request.submittedAt.toISOString(),
      completedAt: step.request.completedAt?.toISOString(),
      steps: step.request.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        approverId: s.approverId,
        approverName: s.approver?.name || undefined,
        status: s.status,
        comments: s.comments || undefined,
        actionAt: s.actionAt?.toISOString(),
        delegatedTo: s.delegatedTo || undefined,
        delegatedToName: s.delegatedToUser?.name || undefined,
      })),
    }));
  }

  /**
   * Get approval request details
   */
  @Get("/{requestId}")
  @Security("jwt")
  public async getApprovalRequest(
    @Request() req: AuthenticatedRequest,
    @Path() requestId: string,
  ): Promise<ApprovalRequestResponse> {
    const ctx = getServerContext();

    const request = await ctx.drizzle.query.approvalRequests.findFirst({
      where: eq(schema.approvalRequests.id, requestId),
      with: {
        workflow: true,
        requestedByUser: true,
        steps: {
          with: {
            approver: true,
            delegatedToUser: true,
          },
          orderBy: [schema.approvalSteps.stepOrder],
        },
      },
    });

    if (!request) {
      throw new Error("Approval request not found");
    }

    return {
      id: request.id,
      workflowId: request.workflowId,
      workflowName: request.workflow.name,
      entityType: request.entityType,
      entityId: request.entityId,
      status: request.status,
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByUser?.name || undefined,
      submittedAt: request.submittedAt.toISOString(),
      completedAt: request.completedAt?.toISOString(),
      steps: request.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        approverId: s.approverId,
        approverName: s.approver?.name || undefined,
        status: s.status,
        comments: s.comments || undefined,
        actionAt: s.actionAt?.toISOString(),
        delegatedTo: s.delegatedTo || undefined,
        delegatedToName: s.delegatedToUser?.name || undefined,
      })),
    };
  }

  /**
   * Approve an approval request
   */
  @Post("/{requestId}/approve")
  @Security("jwt")
  public async approve(
    @Request() req: AuthenticatedRequest,
    @Path() requestId: string,
    @Body() body: ApprovalActionRequest,
  ): Promise<ApprovalActionResponse> {
    const ctx = getServerContext();
    const userId = req.betterAuthSession?.user.id || "";
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";

    // Get the approval request
    const request = await ctx.drizzle.query.approvalRequests.findFirst({
      where: eq(schema.approvalRequests.id, requestId),
      with: {
        workflow: {
          with: {
            steps: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== "pending") {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }

    // Find pending approval step for this user
    const approvalStep = await ctx.drizzle.query.approvalSteps.findFirst({
      where: and(
        eq(schema.approvalSteps.requestId, requestId),
        or(eq(schema.approvalSteps.approverId, userId), eq(schema.approvalSteps.delegatedTo, userId)),
        eq(schema.approvalSteps.status, "pending" as never),
      ),
    });

    if (!approvalStep) {
      throw new Error("No pending approval step found for this user");
    }

    // Check permission
    const hasPermission = await canApprove(userId, organizationId, request.entityType);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to approve this entity");
    }

    // Update approval step
    await ctx.drizzle
      .update(schema.approvalSteps)
      .set({
        status: "approved",
        comments: body.comments || null,
        actionAt: new Date(),
      })
      .where(eq(schema.approvalSteps.id, approvalStep.id));

    // Check if current step is complete
    const rulesEngine = new ApprovalRulesEngine(ctx.drizzle);
    const stepComplete = await rulesEngine.isStepComplete(requestId, approvalStep.stepOrder);

    if (stepComplete) {
      // Move to next step or complete workflow
      const nextStep = await rulesEngine.getNextStep(requestId, approvalStep.stepOrder);

      if (nextStep) {
        // Create approval steps for next workflow step
        const { approverIds } = await rulesEngine.getRequiredApprovers(nextStep.id, organizationId);

        await Promise.all(
          approverIds.map((approverId) =>
            ctx.drizzle.insert(schema.approvalSteps).values({
              requestId: request.id,
              stepOrder: nextStep.stepOrder,
              approverId,
              status: "pending",
            }),
          ),
        );

        return {
          success: true,
          message: `Approval recorded. Moving to next step (${nextStep.stepOrder}).`,
          requestStatus: "pending",
        };
      } else {
        // No more steps - workflow complete
        await ctx.drizzle
          .update(schema.approvalRequests)
          .set({
            status: "approved",
            completedAt: new Date(),
          })
          .where(eq(schema.approvalRequests.id, requestId));

        return {
          success: true,
          message: "Approval completed. All workflow steps approved.",
          requestStatus: "approved",
        };
      }
    }

    return {
      success: true,
      message: "Approval recorded. Awaiting additional approvals for this step.",
      requestStatus: "pending",
    };
  }

  /**
   * Reject an approval request
   */
  @Post("/{requestId}/reject")
  @Security("jwt")
  public async reject(
    @Request() req: AuthenticatedRequest,
    @Path() requestId: string,
    @Body() body: ApprovalActionRequest,
  ): Promise<ApprovalActionResponse> {
    const ctx = getServerContext();
    const userId = req.betterAuthSession?.user.id || "";
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";

    // Get the approval request
    const request = await ctx.drizzle.query.approvalRequests.findFirst({
      where: eq(schema.approvalRequests.id, requestId),
    });

    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== "pending") {
      throw new Error(`Cannot reject request with status: ${request.status}`);
    }

    // Find pending approval step for this user
    const approvalStep = await ctx.drizzle.query.approvalSteps.findFirst({
      where: and(
        eq(schema.approvalSteps.requestId, requestId),
        or(eq(schema.approvalSteps.approverId, userId), eq(schema.approvalSteps.delegatedTo, userId)),
        eq(schema.approvalSteps.status, "pending" as never),
      ),
    });

    if (!approvalStep) {
      throw new Error("No pending approval step found for this user");
    }

    // Check permission
    const hasPermission = await canApprove(userId, organizationId, request.entityType);
    if (!hasPermission) {
      throw new Error("Insufficient permissions to reject this entity");
    }

    // Update approval step
    await ctx.drizzle
      .update(schema.approvalSteps)
      .set({
        status: "rejected",
        comments: body.comments || null,
        actionAt: new Date(),
      })
      .where(eq(schema.approvalSteps.id, approvalStep.id));

    // Reject the entire request
    await ctx.drizzle
      .update(schema.approvalRequests)
      .set({
        status: "rejected",
        completedAt: new Date(),
      })
      .where(eq(schema.approvalRequests.id, requestId));

    return {
      success: true,
      message: "Approval request rejected.",
      requestStatus: "rejected",
    };
  }

  /**
   * Delegate an approval to another user
   */
  @Post("/{requestId}/delegate")
  @Security("jwt")
  public async delegate(
    @Request() req: AuthenticatedRequest,
    @Path() requestId: string,
    @Body() body: DelegateApprovalRequest,
  ): Promise<ApprovalActionResponse> {
    const ctx = getServerContext();
    const userId = req.betterAuthSession?.user.id || "";

    // Find pending approval step for this user
    const approvalStep = await ctx.drizzle.query.approvalSteps.findFirst({
      where: and(
        eq(schema.approvalSteps.requestId, requestId),
        eq(schema.approvalSteps.approverId, userId),
        eq(schema.approvalSteps.status, "pending" as never),
      ),
    });

    if (!approvalStep) {
      throw new Error("No pending approval step found for this user");
    }

    // Update approval step to delegate
    await ctx.drizzle
      .update(schema.approvalSteps)
      .set({
        delegatedTo: body.delegateToUserId,
        comments: body.comments || null,
      })
      .where(eq(schema.approvalSteps.id, approvalStep.id));

    return {
      success: true,
      message: "Approval delegated successfully.",
    };
  }

  /**
   * Get approval history for an entity
   */
  @Get("/history/{entityType}/{entityId}")
  @Security("jwt")
  public async getApprovalHistory(
    @Request() req: AuthenticatedRequest,
    @Path() entityType: string,
    @Path() entityId: string,
  ): Promise<ApprovalRequestResponse[]> {
    const ctx = getServerContext();

    const requests = await ctx.drizzle.query.approvalRequests.findMany({
      where: and(
        eq(schema.approvalRequests.entityType, entityType as never),
        eq(schema.approvalRequests.entityId, entityId),
      ),
      with: {
        workflow: true,
        requestedByUser: true,
        steps: {
          with: {
            approver: true,
            delegatedToUser: true,
          },
          orderBy: [schema.approvalSteps.stepOrder],
        },
      },
      orderBy: [desc(schema.approvalRequests.submittedAt)],
    });

    return requests.map((request) => ({
      id: request.id,
      workflowId: request.workflowId,
      workflowName: request.workflow.name,
      entityType: request.entityType,
      entityId: request.entityId,
      status: request.status,
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByUser?.name || undefined,
      submittedAt: request.submittedAt.toISOString(),
      completedAt: request.completedAt?.toISOString(),
      steps: request.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        approverId: s.approverId,
        approverName: s.approver?.name || undefined,
        status: s.status,
        comments: s.comments || undefined,
        actionAt: s.actionAt?.toISOString(),
        delegatedTo: s.delegatedTo || undefined,
        delegatedToName: s.delegatedToUser?.name || undefined,
      })),
    }));
  }
}
