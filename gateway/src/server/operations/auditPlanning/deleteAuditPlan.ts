import type { DrizzleClient } from "@safee/database";
import { deleteAuditPlan as dbDeleteAuditPlan, getAuditPlanById } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, NotFound } from "../../errors.js";

export async function deleteAuditPlan(
  drizzle: DrizzleClient,
  organizationId: string,
  planId: string,
): Promise<{ success: boolean }> {
  const logger = pino();
  const deps = { drizzle, logger };

  const existingPlan = await getAuditPlanById(deps, planId);
  if (!existingPlan) {
    throw new NotFound("Audit plan not found");
  }

  if (existingPlan.organizationId !== organizationId) {
    throw new NotFound("Audit plan not found");
  }

  try {
    await dbDeleteAuditPlan(deps, planId);

    logger.info(
      {
        planId,
        organizationId,
      },
      "Audit plan deleted successfully",
    );

    return { success: true };
  } catch (err) {
    if (err instanceof NotFound) {
      throw err;
    }

    logger.error({ error: err, organizationId, planId }, "Failed to delete audit plan");
    throw new OperationFailed("Failed to delete audit plan");
  }
}
