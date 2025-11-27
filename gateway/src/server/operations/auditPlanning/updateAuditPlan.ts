import type { DrizzleClient } from "@safee/database";
import { updateAuditPlan as dbUpdateAuditPlan, getAuditPlanById, eq, schema } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound } from "../../errors.js";
import type { UpdateAuditPlanRequest, AuditPlanResponse } from "../../dtos/auditPlanning.js";

export async function updateAuditPlan(
  drizzle: DrizzleClient,
  organizationId: string,
  planId: string,
  request: UpdateAuditPlanRequest,
): Promise<AuditPlanResponse> {
  const logger = pino();
  const deps = { drizzle, logger };

  const existingPlan = await getAuditPlanById(deps, planId);
  if (!existingPlan) {
    throw new NotFound("Audit plan not found");
  }

  if (existingPlan.organizationId !== organizationId) {
    throw new NotFound("Audit plan not found");
  }

  if (request.title !== undefined && request.title.trim().length === 0) {
    throw new InvalidInput("Title cannot be empty");
  }

  if (request.title !== undefined && request.title.length > 500) {
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
    const updatedPlan = await dbUpdateAuditPlan(deps, planId, request);

    logger.info(
      {
        planId: updatedPlan.id,
        organizationId,
      },
      "Audit plan updated successfully",
    );

    return {
      id: updatedPlan.id,
      caseId: updatedPlan.caseId ?? undefined,
      planType: updatedPlan.planType,
      title: updatedPlan.title,
      clientName: updatedPlan.clientName ?? undefined,
      auditType: updatedPlan.auditType ?? undefined,
      auditYear: updatedPlan.auditYear ?? undefined,
      startDate: updatedPlan.startDate ?? undefined,
      targetCompletion: updatedPlan.targetCompletion ?? undefined,
      objectives: updatedPlan.objectives,
      businessUnits: updatedPlan.businessUnits,
      financialAreas: updatedPlan.financialAreas,
      teamMembers: updatedPlan.teamMembers,
      phaseBreakdown: updatedPlan.phaseBreakdown,
      totalBudget: updatedPlan.totalBudget ?? undefined,
      totalHours: updatedPlan.totalHours ?? undefined,
      materialityThreshold: updatedPlan.materialityThreshold ?? undefined,
      riskAssessment: updatedPlan.riskAssessment,
      status: updatedPlan.status,
      organizationId: updatedPlan.organizationId,
      createdBy: updatedPlan.createdBy,
      createdAt: updatedPlan.createdAt,
      updatedAt: updatedPlan.updatedAt,
    };
  } catch (err) {
    if (err instanceof InvalidInput || err instanceof NotFound) {
      throw err;
    }

    logger.error({ error: err, organizationId, planId, request }, "Failed to update audit plan");
    throw new OperationFailed("Failed to update audit plan");
  }
}
