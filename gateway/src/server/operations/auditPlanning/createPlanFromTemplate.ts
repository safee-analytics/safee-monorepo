import type { DrizzleClient } from "@safee/database";
import { createAuditPlan, getAuditPlanTemplateById } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, NotFound, InvalidInput } from "../../errors.js";
import type { CreatePlanFromTemplateRequest, AuditPlanResponse } from "../../dtos/auditPlanning.js";

export async function createPlanFromTemplate(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  request: CreatePlanFromTemplateRequest,
): Promise<AuditPlanResponse> {
  const logger = pino();
  const deps = { drizzle, logger };

  const template = await getAuditPlanTemplateById(deps, request.templateId);
  if (!template) {
    throw new NotFound("Template not found");
  }

  if (!template.isActive) {
    throw new InvalidInput("Template is not active");
  }

  if (!request.title || request.title.trim().length === 0) {
    throw new InvalidInput("Title cannot be empty");
  }

  try {
    const newPlan = await createAuditPlan(deps, {
      organizationId,
      createdBy: userId,
      planType: "standalone",
      title: request.title.trim(),
      clientName: request.clientName,
      caseType: template.caseType,
      auditYear: request.auditYear,
      startDate: request.startDate,
      targetCompletion: undefined,
      objectives: template.defaultObjectives ?? [],
      businessUnits: template.defaultBusinessUnits ?? {},
      financialAreas: template.defaultFinancialAreas ?? {},
      teamMembers: [],
      phaseBreakdown: template.defaultPhases ?? [],
      totalBudget: template.estimatedBudget,
      totalHours: template.estimatedHours,
      materialityThreshold: undefined,
      riskAssessment: undefined,
      status: "draft",
    });

    logger.info(
      {
        planId: newPlan.id,
        templateId: request.templateId,
        organizationId,
        userId,
      },
      "Audit plan created from template successfully",
    );

    return {
      id: newPlan.id,
      caseId: newPlan.caseId,
      planType: newPlan.planType,
      title: newPlan.title,
      clientName: newPlan.clientName,
      caseType: newPlan.caseType,
      auditYear: newPlan.auditYear,
      startDate: newPlan.startDate,
      targetCompletion: newPlan.targetCompletion,
      objectives: newPlan.objectives,
      businessUnits: newPlan.businessUnits,
      financialAreas: newPlan.financialAreas,
      teamMembers: newPlan.teamMembers,
      phaseBreakdown: newPlan.phaseBreakdown,
      totalBudget: newPlan.totalBudget,
      totalHours: newPlan.totalHours,
      materialityThreshold: newPlan.materialityThreshold,
      riskAssessment: newPlan.riskAssessment,
      status: newPlan.status,
      organizationId: newPlan.organizationId,
      createdBy: newPlan.createdBy,
      createdAt: newPlan.createdAt,
      updatedAt: newPlan.updatedAt,
    };
  } catch (err) {
    if (err instanceof NotFound || err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, request }, "Failed to create plan from template");
    throw new OperationFailed("Failed to create plan from template");
  }
}
