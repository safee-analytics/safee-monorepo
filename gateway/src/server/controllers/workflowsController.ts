import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Security,
  Body,
  Path,
  Query,
  Request,
  SuccessResponse,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext } from "../serverContext.js";
import { schema, workflowRulesSchema, ruleSchema, eq, and  } from "@safee/database";
import { z } from "zod";

type StepType = "single" | "parallel" | "any";
type ApproverType = "role" | "team" | "user";

interface WorkflowRules {
  autoApprove?: boolean;
  requireComments?: boolean;
  allowReassignment?: boolean;
  timeoutHours?: number;
  escalationUserIds?: string[];
  notifyOnSubmit?: boolean;
  notifyOnComplete?: boolean;
}

type RuleCondition =
  | {
      type: "amount";
      operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
      value: number;
    }
  | {
      type: "entityType";
      operator?: "eq";
      value: string;
    }
  | {
      type: "userRole";
      operator?: "eq";
      value: string;
    }
  | {
      type: "manual";
    }
  | {
      type: "field";
      field: string;
      operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "contains";
      value: string | number | boolean;
    };

interface Rule {
  conditions: RuleCondition[];
  logic?: "AND" | "OR";
}

const stepTypeSchema = z.enum(["single", "parallel", "any"]);
const approverTypeSchema = z.enum(["role", "team", "user"]);

const workflowStepInputSchema = z.object({
  stepOrder: z.number(),
  stepType: stepTypeSchema,
  approverType: approverTypeSchema,
  approverId: z.string().optional(),
  minApprovals: z.number().optional(),
  requiredApprovers: z.number().optional(),
});

const entityTypeSchema = z.enum(["job", "invoice", "user", "organization", "employee", "contact", "deal"]);

const createWorkflowSchema = z.object({
  name: z.string(),
  entityType: entityTypeSchema,
  rules: workflowRulesSchema,
  steps: z.array(workflowStepInputSchema),
});

interface CreateWorkflowRequest {
  name: string;
  entityType: string;
  rules?: WorkflowRules;
  steps: WorkflowStepInput[];
}

interface WorkflowStepInput {
  stepOrder: number;
  stepType: StepType;
  approverType: ApproverType;
  approverId?: string;
  minApprovals?: number;
  requiredApprovers?: number;
}

interface UpdateWorkflowRequest {
  name?: string;
  isActive?: boolean;
  rules?: WorkflowRules;
  steps?: WorkflowStepInput[];
}

interface WorkflowResponse {
  id: string;
  name: string;
  organizationId: string;
  entityType: string;
  isActive: boolean;
  rules?: WorkflowRules;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStepResponse[];
}

interface WorkflowStepResponse {
  id: string;
  stepOrder: number;
  stepType: StepType;
  approverType: ApproverType;
  approverId?: string;
  minApprovals: number;
  requiredApprovers: number;
}

interface CreateRuleRequest {
  entityType: string;
  ruleName: string;
  conditions: string; // JSON string
  workflowId: string;
  priority?: number;
}

interface RuleResponse {
  id: string;
  organizationId: string;
  entityType: string;
  ruleName: string;
  conditions: Rule;
  workflowId: string;
  priority: number;
}

@Route("workflows")
@Tags("Workflows")
export class WorkflowsController extends Controller {
  /**
   * Create a new workflow
   */
  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Workflow created successfully")
  public async createWorkflow(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateWorkflowRequest,
  ): Promise<WorkflowResponse> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    // Validate with Zod
    const validated = createWorkflowSchema.parse(request);

    // Create workflow
    const [workflow] = await ctx.drizzle
      .insert(schema.approvalWorkflows)
      .values({
        name: validated.name,
        organizationId,
        entityType: validated.entityType,
        isActive: true,
        rules: validated.rules,
      })
      .returning();

    // Create workflow steps
    const stepsToInsert = validated.steps.map((step) => ({
      workflowId: workflow.id,
      stepOrder: step.stepOrder,
      stepType: step.stepType,
      approverType: step.approverType,
      approverId: step.approverId,
      minApprovals: step.minApprovals ?? 1,
      requiredApprovers: step.requiredApprovers ?? 1,
    }));

    const steps = await ctx.drizzle.insert(schema.approvalWorkflowSteps).values(stepsToInsert).returning();

    this.setStatus(201);

    return {
      id: workflow.id,
      name: workflow.name,
      organizationId: workflow.organizationId,
      entityType: workflow.entityType,
      isActive: workflow.isActive,
      rules: workflow.rules ,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
      steps: steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        stepType: stepTypeSchema.parse(s.stepType),
        approverType: approverTypeSchema.parse(s.approverType),
        approverId: s.approverId ,
        minApprovals: s.minApprovals,
        requiredApprovers: s.requiredApprovers,
      })),
    };
  }

  /**
   * List all workflows
   */
  @Get("/")
  @Security("jwt")
  public async listWorkflows(
    @Request() req: AuthenticatedRequest,
    @Query() entityType?: string,
    @Query() isActive?: boolean,
  ): Promise<WorkflowResponse[]> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    const workflows = await ctx.drizzle.query.approvalWorkflows.findMany({
      where: and(
        eq(schema.approvalWorkflows.organizationId, organizationId),
        entityType ? eq(schema.approvalWorkflows.entityType, entityType as never) : undefined,
        isActive !== undefined ? eq(schema.approvalWorkflows.isActive, isActive) : undefined,
      ),
      with: {
        steps: {
          orderBy: [schema.approvalWorkflowSteps.stepOrder],
        },
      },
    });

    return workflows.map((w) => ({
      id: w.id,
      name: w.name,
      organizationId: w.organizationId,
      entityType: w.entityType,
      isActive: w.isActive,
      rules: w.rules ,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      steps: w.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        stepType: stepTypeSchema.parse(s.stepType),
        approverType: approverTypeSchema.parse(s.approverType),
        approverId: s.approverId ,
        minApprovals: s.minApprovals,
        requiredApprovers: s.requiredApprovers,
      })),
    }));
  }

  /**
   * Get workflow details
   */
  @Get("/{workflowId}")
  @Security("jwt")
  public async getWorkflow(
    @Request() req: AuthenticatedRequest,
    @Path() workflowId: string,
  ): Promise<WorkflowResponse> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    const workflow = await ctx.drizzle.query.approvalWorkflows.findFirst({
      where: and(
        eq(schema.approvalWorkflows.id, workflowId),
        eq(schema.approvalWorkflows.organizationId, organizationId),
      ),
      with: {
        steps: {
          orderBy: [schema.approvalWorkflowSteps.stepOrder],
        },
      },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    return {
      id: workflow.id,
      name: workflow.name,
      organizationId: workflow.organizationId,
      entityType: workflow.entityType,
      isActive: workflow.isActive,
      rules: workflow.rules ,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
      steps: workflow.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        stepType: stepTypeSchema.parse(s.stepType),
        approverType: approverTypeSchema.parse(s.approverType),
        approverId: s.approverId ,
        minApprovals: s.minApprovals,
        requiredApprovers: s.requiredApprovers,
      })),
    };
  }

  /**
   * Update workflow
   */
  @Put("/{workflowId}")
  @Security("jwt")
  public async updateWorkflow(
    @Request() req: AuthenticatedRequest,
    @Path() workflowId: string,
    @Body() request: UpdateWorkflowRequest,
  ): Promise<WorkflowResponse> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    // Update workflow
    const [workflow] = await ctx.drizzle
      .update(schema.approvalWorkflows)
      .set({
        name: request.name,
        isActive: request.isActive,
        rules: request.rules,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.approvalWorkflows.id, workflowId),
          eq(schema.approvalWorkflows.organizationId, organizationId),
        ),
      )
      .returning();

    // workflow is undefined if not found
    if (workflow === undefined) {
      throw new Error("Workflow not found");
    }

    // Update steps if provided
    if (request.steps) {
      // Validate steps with Zod
      const validatedSteps = z.array(workflowStepInputSchema).parse(request.steps);

      // Delete existing steps
      await ctx.drizzle
        .delete(schema.approvalWorkflowSteps)
        .where(eq(schema.approvalWorkflowSteps.workflowId, workflowId));

      // Insert new steps
      const stepsToInsert = validatedSteps.map((step) => ({
        workflowId: workflow.id,
        stepOrder: step.stepOrder,
        stepType: step.stepType,
        approverType: step.approverType,
        approverId: step.approverId,
        minApprovals: step.minApprovals ?? 1,
        requiredApprovers: step.requiredApprovers ?? 1,
      }));

      await ctx.drizzle.insert(schema.approvalWorkflowSteps).values(stepsToInsert);
    }

    // Fetch updated workflow with steps
    return this.getWorkflow(req, workflowId);
  }

  /**
   * Delete workflow
   */
  @Delete("/{workflowId}")
  @Security("jwt")
  public async deleteWorkflow(
    @Request() req: AuthenticatedRequest,
    @Path() workflowId: string,
  ): Promise<{ success: boolean }> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    await ctx.drizzle
      .delete(schema.approvalWorkflows)
      .where(
        and(
          eq(schema.approvalWorkflows.id, workflowId),
          eq(schema.approvalWorkflows.organizationId, organizationId),
        ),
      );

    return { success: true };
  }

  /**
   * Activate workflow
   */
  @Post("/{workflowId}/activate")
  @Security("jwt")
  public async activateWorkflow(
    @Request() req: AuthenticatedRequest,
    @Path() workflowId: string,
  ): Promise<{ success: boolean }> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    await ctx.drizzle
      .update(schema.approvalWorkflows)
      .set({ isActive: true, updatedAt: new Date() })
      .where(
        and(
          eq(schema.approvalWorkflows.id, workflowId),
          eq(schema.approvalWorkflows.organizationId, organizationId),
        ),
      );

    return { success: true };
  }

  /**
   * Deactivate workflow
   */
  @Post("/{workflowId}/deactivate")
  @Security("jwt")
  public async deactivateWorkflow(
    @Request() req: AuthenticatedRequest,
    @Path() workflowId: string,
  ): Promise<{ success: boolean }> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    await ctx.drizzle
      .update(schema.approvalWorkflows)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.approvalWorkflows.id, workflowId),
          eq(schema.approvalWorkflows.organizationId, organizationId),
        ),
      );

    return { success: true };
  }

  /**
   * Create approval rule
   */
  @Post("/rules")
  @Security("jwt")
  @SuccessResponse("201", "Rule created successfully")
  public async createRule(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateRuleRequest,
  ): Promise<RuleResponse> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    const [rule] = await ctx.drizzle
      .insert(schema.approvalRules)
      .values({
        organizationId,
        entityType: request.entityType as never,
        ruleName: request.ruleName,
        conditions: request.conditions,
        workflowId: request.workflowId,
        priority: request.priority ?? 0,
      })
      .returning();

    this.setStatus(201);

    return {
      id: rule.id,
      organizationId: rule.organizationId,
      entityType: rule.entityType,
      ruleName: rule.ruleName,
      conditions: ruleSchema.parse(rule.conditions),
      workflowId: rule.workflowId,
      priority: rule.priority,
    };
  }

  /**
   * List approval rules
   */
  @Get("/rules")
  @Security("jwt")
  public async listRules(
    @Request() req: AuthenticatedRequest,
    @Query() entityType?: string,
  ): Promise<RuleResponse[]> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    const rules = await ctx.drizzle.query.approvalRules.findMany({
      where: and(
        eq(schema.approvalRules.organizationId, organizationId),
        entityType ? eq(schema.approvalRules.entityType, entityType as never) : undefined,
      ),
      orderBy: [schema.approvalRules.priority],
    });

    return rules.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      entityType: r.entityType,
      ruleName: r.ruleName,
      conditions: ruleSchema.parse(r.conditions),
      workflowId: r.workflowId,
      priority: r.priority,
    }));
  }

  /**
   * Delete approval rule
   */
  @Delete("/rules/{ruleId}")
  @Security("jwt")
  public async deleteRule(
    @Request() req: AuthenticatedRequest,
    @Path() ruleId: string,
  ): Promise<{ success: boolean }> {
    const ctx = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    await ctx.drizzle
      .delete(schema.approvalRules)
      .where(
        and(eq(schema.approvalRules.id, ruleId), eq(schema.approvalRules.organizationId, organizationId)),
      );

    return { success: true };
  }
}
