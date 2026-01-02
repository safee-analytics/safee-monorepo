import type { DrizzleClient } from "@safee/database";
import { updateAuditPlan as dbUpdateAuditPlan, getAuditPlanById } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound } from "../../errors.js";
import type { UpdateAuditPlanRequest, AuditPlanResponse } from "../../dtos/auditPlanning.js";
import crypto from "node:crypto";

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

  const title = request.title ?? undefined;

  if (title?.trim().length === 0) {
    throw new InvalidInput("Title cannot be empty");
  }

  if (title !== undefined && title.length > 500) {
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
    const objectives = request.objectives?.map((obj) => ({
      id: obj.id ?? crypto.randomUUID(),
      description: obj.description,
      priority: obj.priority,
    }));

    const teamMembers = request.teamMembers
      // eslint-disable-next-line eqeqeq
      ?.filter((member): member is typeof member & { userId: string } => member.userId != null)
      .map((member) => ({
        userId: member.userId,
        name: member.name,
        role: member.role,
        hours: member.hours,
      }));

    const phaseBreakdown = request.phaseBreakdown?.map((phase) => ({
      name: phase.name ?? "",
      duration: phase.duration,
      description: phase.description,
      startDate: phase.startDate,
      endDate: phase.endDate,
    }));

    const riskAssessment = request.riskAssessment
      ? {
          risks: request.riskAssessment.risks?.map((risk) => ({
            type: risk.type ?? "",
            severity: risk.severity,
            message: risk.message,
          })),
          overallRisk: request.riskAssessment.overallRisk,
          score: request.riskAssessment.score,
        }
      : undefined;

    const updatedPlan = await dbUpdateAuditPlan(deps, planId, {
      title: title?.trim(),
      status: request.status ?? undefined,
      caseId: request.caseId ?? undefined,
      planType: request.planType ?? undefined,
      clientName: request.clientName ?? undefined,
      caseType: request.caseType ?? undefined,
      auditYear: request.auditYear ?? undefined,
      startDate: request.startDate ?? undefined,
      targetCompletion: request.targetCompletion ?? undefined,
      businessUnits: request.businessUnits ?? undefined,
      financialAreas: request.financialAreas ?? undefined,
      totalBudget: request.totalBudget ?? undefined,
      totalHours: request.totalHours ?? undefined,
      materialityThreshold: request.materialityThreshold ?? undefined,
      objectives,
      teamMembers,
      phaseBreakdown,
      riskAssessment,
    });

    logger.info(
      {
        planId: updatedPlan.id,
        organizationId,
      },
      "Audit plan updated successfully",
    );

    return {
      id: updatedPlan.id,
      caseId: updatedPlan.caseId,
      planType: updatedPlan.planType,
      title: updatedPlan.title,
      clientName: updatedPlan.clientName,
      caseType: updatedPlan.caseType,
      auditYear: updatedPlan.auditYear,
      startDate: updatedPlan.startDate,
      targetCompletion: updatedPlan.targetCompletion,
      objectives: updatedPlan.objectives,
      businessUnits: updatedPlan.businessUnits,
      financialAreas: updatedPlan.financialAreas,
      teamMembers: updatedPlan.teamMembers,
      phaseBreakdown: updatedPlan.phaseBreakdown,
      totalBudget: updatedPlan.totalBudget,
      totalHours: updatedPlan.totalHours,
      materialityThreshold: updatedPlan.materialityThreshold,
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
