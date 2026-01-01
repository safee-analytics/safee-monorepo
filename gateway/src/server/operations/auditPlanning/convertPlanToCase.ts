import type { DrizzleClient } from "@safee/database";
import { getAuditPlanById, updateAuditPlan, createCase } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, NotFound, InvalidInput } from "../../errors.js";

export async function convertPlanToCase(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  planId: string,
): Promise<{ caseId: string; message: string }> {
  const logger = pino();
  const deps = { drizzle, logger };

  const plan = await getAuditPlanById(deps, planId);
  if (!plan) {
    throw new NotFound("Audit plan not found");
  }

  if (plan.organizationId !== organizationId) {
    throw new NotFound("Audit plan not found");
  }

  if (plan.status !== "approved") {
    throw new InvalidInput("Only approved plans can be converted to cases");
  }

  if (plan.caseId) {
    throw new InvalidInput("Plan has already been converted to a case");
  }

  if (!plan.caseType) {
    throw new InvalidInput("Case type is required to convert to case");
  }

  try {
    const latestCase = await drizzle.query.cases.findFirst({
      where: (t, { eq }) => eq(t.organizationId, organizationId),
      orderBy: (cases, { desc }) => [desc(cases.createdAt)],
    });

    let nextNumber = 1;
    if (latestCase?.caseNumber) {
      const match = /CASE-(\d+)/.exec(latestCase.caseNumber);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const caseNumber = `CASE-${String(nextNumber).padStart(3, "0")}`;

    const newCase = await createCase(deps, {
      organizationId,
      caseNumber,
      title: plan.title,
      caseType: plan.caseType,
      status: "draft",
      priority: "medium",
      dueDate: plan.targetCompletion ? new Date(plan.targetCompletion) : undefined,
      createdBy: userId,
    });

    await updateAuditPlan(deps, planId, {
      caseId: newCase.id,
      status: "converted",
    });

    logger.info(
      {
        planId,
        caseId: newCase.id,
        organizationId,
        userId,
      },
      "Audit plan converted to case successfully",
    );

    return {
      caseId: newCase.id,
      message: `Plan converted to case ${caseNumber} successfully`,
    };
  } catch (err) {
    if (err instanceof NotFound || err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, planId }, "Failed to convert plan to case");
    throw new OperationFailed("Failed to convert plan to case");
  }
}
