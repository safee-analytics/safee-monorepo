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
import {
  getApprovalRequestsByApprover,
  getApprovalRequestById,
  getApprovalHistoryByEntity,
} from "@safee/database";
import { submitForApproval as submitForApprovalOp } from "../operations/approvals/submitForApproval.js";
import { approve as approveOp } from "../operations/approvals/approve.js";
import { reject as rejectOp } from "../operations/approvals/reject.js";
import { delegate as delegateOp } from "../operations/approvals/delegate.js";
import type { EntityData } from "../services/approval-rules-engine.js";

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
    const userId = req.betterAuthSession?.user.id || "";
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";

    const result = await submitForApprovalOp(req.drizzle, organizationId, userId, request);

    this.setStatus(201);
    return result;
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
    const userId = req.betterAuthSession?.user.id || "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    // Find approval steps assigned to this user
    const approvalSteps = await getApprovalRequestsByApprover(deps, userId, status);

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
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const request = await getApprovalRequestById(deps, requestId);

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
    const userId = req.betterAuthSession?.user.id || "";
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";

    return await approveOp(req.drizzle, organizationId, userId, requestId, body);
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
    const userId = req.betterAuthSession?.user.id || "";
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";

    return await rejectOp(req.drizzle, organizationId, userId, requestId, body);
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
    const userId = req.betterAuthSession?.user.id || "";

    return await delegateOp(req.drizzle, userId, requestId, body);
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
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const requests = await getApprovalHistoryByEntity(deps, entityType, entityId);

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
