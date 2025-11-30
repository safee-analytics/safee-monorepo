import type { DrizzleClient } from "@safee/database";
import { createAuditPlan as dbCreateAuditPlan } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput } from "../../errors.js";
import type { CreateAuditPlanRequest, AuditPlanResponse } from "../../dtos/auditPlanning.js";

export async function createAuditPlan(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  request: CreateAuditPlanRequest,
): Promise<AuditPlanResponse> {
  const logger = pino();

  if (!request.title || request.title.trim().length === 0) {
    throw new InvalidInput("Title cannot be empty");
  }

  if (request.title.length > 500) {
    throw new InvalidInput("Title must be less than 500 characters");
  }

  if (request.startDate && request.targetCompletion) {
    const startDate = new Date(request.startDate);
    const targetDate = new Date(request.targetCompletion);
    if (targetDate < startDate) {
      throw new InvalidInput("Target completion date cannot be before start date");
    }
  }

  try {
    const deps = { drizzle, logger };

    const newPlan = await dbCreateAuditPlan(deps, {
      organizationId,
      createdBy: userId,
      planType: request.planType ?? "standalone",
      title: request.title.trim(),
      caseId: request.caseId,
      clientName: request.clientName,
      auditType: request.auditType,
      auditYear: request.auditYear,
      startDate: request.startDate ?? undefined,
      targetCompletion: request.targetCompletion ?? undefined,
      objectives: request.objectives ?? [],
      businessUnits: request.businessUnits ?? {},
      financialAreas: request.financialAreas ?? {},
      teamMembers: request.teamMembers ?? [],
      phaseBreakdown: request.phaseBreakdown ?? [],
      totalBudget: request.totalBudget,
      totalHours: request.totalHours,
      materialityThreshold: request.materialityThreshold,
      riskAssessment: request.riskAssessment,
      status: request.status ?? "draft",
    });

    logger.info(
      {
        planId: newPlan.id,
        title: newPlan.title,
        organizationId,
        userId,
      },
      "Audit plan created successfully",
    );

    return {
      id: newPlan.id,
      caseId: newPlan.caseId ?? undefined,
      planType: newPlan.planType,
      title: newPlan.title,
      clientName: newPlan.clientName ?? undefined,
      auditType: newPlan.auditType ?? undefined,
      auditYear: newPlan.auditYear ?? undefined,
      startDate: newPlan.startDate ?? undefined,
      targetCompletion: newPlan.targetCompletion ?? undefined,
      objectives: newPlan.objectives,
      businessUnits: newPlan.businessUnits,
      financialAreas: newPlan.financialAreas,
      teamMembers: newPlan.teamMembers,
      phaseBreakdown: newPlan.phaseBreakdown,
      totalBudget: newPlan.totalBudget ?? undefined,
      totalHours: newPlan.totalHours ?? undefined,
      materialityThreshold: newPlan.materialityThreshold ?? undefined,
      riskAssessment: newPlan.riskAssessment,
      status: newPlan.status,
      organizationId: newPlan.organizationId,
      createdBy: newPlan.createdBy,
      createdAt: newPlan.createdAt,
      updatedAt: newPlan.updatedAt,
    };
  } catch (err) {
    if (err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, request }, "Failed to create audit plan");
    throw new OperationFailed("Failed to create audit plan");
  }
}
