import { schema, ruleSchema, type Rule, type RuleCondition } from "@safee/database";
import { eq, and, desc } from "@safee/database";
import type { ServerContext } from "../serverContext.js";

// Explicit type for TSOA compatibility
export type EntityType = "job" | "invoice" | "user" | "organization" | "employee" | "contact" | "deal";

export type RuleConditionOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "contains";

export type RuleConditionType = "amount" | "entityType" | "userRole" | "manual" | "field";

// Re-export from database for convenience
export type { Rule, RuleCondition };

export interface EntityData {
  entityType: EntityType;
  entityId: string;
  amount?: number;
  status?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export class ApprovalRulesEngine {
  constructor(private readonly ctx: ServerContext) {}

  private get drizzle() {
    return this.ctx.drizzle;
  }

  private get logger() {
    return this.ctx.logger;
  }

  async findMatchingWorkflow(
    organizationId: string,
    entityData: EntityData,
  ): Promise<{ workflowId: string; workflow: unknown } | null> {
    try {
      const rules = await this.drizzle.query.approvalRules.findMany({
        where: and(
          eq(schema.approvalRules.organizationId, organizationId),
          eq(schema.approvalRules.entityType, entityData.entityType),
        ),
        orderBy: [desc(schema.approvalRules.priority)],
        with: {
          workflow: true,
        },
      });

      if (rules.length === 0) {
        this.logger.debug({ organizationId, entityType: entityData.entityType }, "No approval rules found");
        return null;
      }

      for (const rule of rules) {
        if (!rule.workflow.isActive) {
          continue;
        }

        const ruleConfig = this.parseRuleConditions(rule.conditions);
        const matches = this.evaluateRule(ruleConfig, entityData);

        if (matches) {
          this.logger.info(
            {
              ruleId: rule.id,
              workflowId: rule.workflowId,
              entityType: entityData.entityType,
              entityId: entityData.entityId,
            },
            "Matched approval rule to workflow",
          );

          return {
            workflowId: rule.workflowId,
            workflow: rule.workflow,
          };
        }
      }

      this.logger.debug({ organizationId, entityData }, "No matching approval rule found");
      return null;
    } catch (err) {
      this.logger.error({ error: err, organizationId, entityData }, "Error finding matching workflow");
      throw err;
    }
  }

  private parseRuleConditions(conditions: unknown): Rule {
    try {
      const parsed = ruleSchema.parse(conditions);
      return parsed;
    } catch (err) {
      this.logger.error(
        { error: err, conditions, conditionsType: typeof conditions },
        "Error parsing rule conditions",
      );
      return { conditions: [], logic: "AND" };
    }
  }

  private evaluateRule(rule: Rule, entityData: EntityData): boolean {
    const { conditions, logic = "AND" } = rule;

    if (conditions.length === 0) {
      return false;
    }

    const results = conditions.map((condition) => this.evaluateCondition(condition, entityData));

    if (logic === "OR") {
      return results.some((result) => result);
    } 
      return results.every((result) => result);
    
  }

  private evaluateCondition(condition: RuleCondition, entityData: EntityData): boolean {
    switch (condition.type) {
      case "amount":
        return this.evaluateAmountCondition(entityData.amount, condition.operator, condition.value);

      case "entityType":
        return entityData.entityType === condition.value;

      case "userRole":
        // This would need user role from context
        return true; // TODO: Implement user role check

      case "manual":
        // Manual submission always matches
        return true;

      case "field":
        return this.evaluateFieldCondition(entityData[condition.field], condition.operator, condition.value);

      default:
        return false;
    }
  }

  private evaluateAmountCondition(amount: number | undefined, operator: string, threshold: number): boolean {
    if (amount === undefined) return false;

    switch (operator) {
      case "gt":
        return amount > threshold;
      case "gte":
        return amount >= threshold;
      case "lt":
        return amount < threshold;
      case "lte":
        return amount <= threshold;
      case "eq":
        return amount === threshold;
      case "neq":
        return amount !== threshold;
      default:
        return false;
    }
  }

  private evaluateFieldCondition(fieldValue: unknown, operator: string, expectedValue: unknown): boolean {
    switch (operator) {
      case "eq":
        return fieldValue === expectedValue;
      case "neq":
        return fieldValue !== expectedValue;
      case "contains":
        if (typeof fieldValue === "string" && typeof expectedValue === "string") {
          return fieldValue.includes(expectedValue);
        }
        return false;
      case "gt":
      case "gte":
      case "lt":
      case "lte":
        if (typeof fieldValue === "number" && typeof expectedValue === "number") {
          return this.evaluateAmountCondition(fieldValue, operator, expectedValue);
        }
        return false;
      default:
        return false;
    }
  }

  async getWorkflowSteps(workflowId: string) {
    return this.drizzle.query.approvalWorkflowSteps.findMany({
      where: eq(schema.approvalWorkflowSteps.workflowId, workflowId),
      orderBy: [schema.approvalWorkflowSteps.stepOrder],
    });
  }

  async getRequiredApprovers(
    workflowStepId: string,
    organizationId: string,
  ): Promise<{ approverIds: string[]; approverType: string }> {
    const step = await this.drizzle.query.approvalWorkflowSteps.findFirst({
      where: eq(schema.approvalWorkflowSteps.id, workflowStepId),
    });

    if (!step) {
      throw new Error(`Workflow step not found: ${workflowStepId}`);
    }

    const approverIds: string[] = [];

    if (step.approverType === "user" && step.approverId) {
      // Direct user assignment
      approverIds.push(step.approverId);
    } else if (step.approverType === "team" && step.approverId) {
      // Get all members of the team
      // TODO: Query Better-Auth team_members table when schema is available
      const members = await this.drizzle.query.members.findMany({
        where: eq(schema.members.organizationId, organizationId),
      });
      approverIds.push(...members.map((m) => m.userId));
    } else if (step.approverType === "role" && step.approverId) {
      // Get all users with this role
      const members = await this.drizzle.query.members.findMany({
        where: and(
          eq(schema.members.organizationId, organizationId),
          eq(schema.members.role, step.approverId),
        ),
      });
      approverIds.push(...members.map((m) => m.userId));
    }

    return {
      approverIds,
      approverType: step.approverType,
    };
  }

  /**
   * Check if workflow step is complete
   */
  async isStepComplete(requestId: string, stepOrder: number): Promise<boolean> {
    // Get the workflow request
    const request = await this.drizzle.query.approvalRequests.findFirst({
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
      throw new Error(`Approval request not found: ${requestId}`);
    }

    const workflowStep = request.workflow.steps.find((s) => s.stepOrder === stepOrder);
    if (!workflowStep) {
      throw new Error(`Workflow step ${stepOrder} not found`);
    }

    // Get approval steps for this request and step order
    const approvalSteps = await this.drizzle.query.approvalSteps.findMany({
      where: and(
        eq(schema.approvalSteps.requestId, requestId),
        eq(schema.approvalSteps.stepOrder, stepOrder),
      ),
    });

    const approvedCount = approvalSteps.filter((s) => s.status === "approved").length;
    const rejectedCount = approvalSteps.filter((s) => s.status === "rejected").length;

    // If any rejection, step is complete (and failed)
    if (rejectedCount > 0) {
      return true;
    }

    // Check based on step type
    if (workflowStep.stepType === "single") {
      // Single approval - need at least one approval
      return approvedCount >= 1;
    } else if (workflowStep.stepType === "parallel") {
      // Parallel - need minimum approvals
      return approvedCount >= workflowStep.minApprovals;
    } else {
      // "any" - need at least one approval
      return approvedCount >= 1;
    }
  }

  /**
   * Get next step in workflow
   */
  async getNextStep(requestId: string, currentStepOrder: number) {
    const request = await this.drizzle.query.approvalRequests.findFirst({
      where: eq(schema.approvalRequests.id, requestId),
    });

    if (!request) {
      return null;
    }

    const nextSteps = await this.drizzle.query.approvalWorkflowSteps.findMany({
      where: and(
        eq(schema.approvalWorkflowSteps.workflowId, request.workflowId),
        eq(schema.approvalWorkflowSteps.stepOrder, currentStepOrder + 1),
      ),
      orderBy: [schema.approvalWorkflowSteps.stepOrder],
      limit: 1,
    });

    return nextSteps[0] || null;
  }
}
