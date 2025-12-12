import type { DrizzleClient } from "@safee/database";
import { createAuditPlan as dbCreateAuditPlan } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput } from "../../errors.js";
import type { CreateAuditPlanRequest, AuditPlanResponse } from "../../dtos/auditPlanning.js";
import crypto from "node:crypto";

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
    const objectives =
      request.objectives?.map((obj) => ({
        id: obj.id ?? crypto.randomUUID(),
        description: obj.description,
        priority: obj.priority ?? undefined,
      })) ?? [];
    const teamMembers =
      request.teamMembers
        // eslint-disable-next-line eqeqeq
        ?.filter((member): member is typeof member & { userId: string } => member.userId != null)
        .map((member) => ({
          userId: member.userId,
          name: member.name,
          role: member.role,
          hours: member.hours ?? undefined,
        })) ?? [];
    const phaseBreakdown =
      request.phaseBreakdown?.map((phase) => ({
        name: phase.name ?? "",
        duration: phase.duration,
        description: phase.description ?? undefined,
        startDate: phase.startDate ?? undefined,
        endDate: phase.endDate ?? undefined,
      })) ?? [];
    const riskAssessment = request.riskAssessment
      ? {
          risks:
            request.riskAssessment.risks?.map((risk) => ({
              type: risk.type ?? "",
              severity: risk.severity,
              message: risk.message,
            })) ?? undefined,
          overallRisk: request.riskAssessment.overallRisk ?? undefined,
          score: request.riskAssessment.score ?? undefined,
        }
      : undefined;

    const newPlan = await dbCreateAuditPlan(deps, {
      organizationId,
      createdBy: userId,
      planType: request.planType ?? "standalone",
      title: request.title.trim(),
      caseId: request.caseId,
      clientName: request.clientName,
      auditType: request.auditType,
      auditYear: request.auditYear,
      startDate: request.startDate,
      targetCompletion: request.targetCompletion,
      objectives,
      businessUnits: request.businessUnits ?? {},
      financialAreas: request.financialAreas ?? {},
      teamMembers,
      phaseBreakdown,
      totalBudget: request.totalBudget,
      totalHours: request.totalHours,
      materialityThreshold: request.materialityThreshold,
      riskAssessment,
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
      caseId: newPlan.caseId,
      planType: newPlan.planType,
      title: newPlan.title,
      clientName: newPlan.clientName,
      auditType: newPlan.auditType,
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
    if (err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, request }, "Failed to create audit plan");
    throw new OperationFailed("Failed to create audit plan");
  }
}
