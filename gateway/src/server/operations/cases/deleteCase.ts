import type { DrizzleClient } from "@safee/database";
import {
  getCaseById,
  getScopesByCase,
  deleteCase as dbDeleteCase,
  createHistoryEntry,
} from "@safee/database";
import { pino } from "pino";
import { OperationFailed, NotFound, InsufficientPermissions, InvalidInput } from "../../errors.js";

export async function deleteCase(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  caseId: string,
): Promise<{ success: boolean }> {
  const logger = pino();
  const deps = { drizzle, logger };

  let existingCase;
  try {
    existingCase = await getCaseById(deps, caseId);
  } catch {
    throw new NotFound("Case not found");
  }

  if (!existingCase) {
    throw new NotFound("Case not found");
  }

  // Authorization: Check organization ownership
  if (existingCase.organizationId !== organizationId) {
    throw new InsufficientPermissions("You don't have permission to delete this case");
  }

  // Validation: Cannot delete case with active scopes
  const scopes = await getScopesByCase(deps, caseId);
  const activeScopes = scopes.filter((s) => s.status !== "archived");

  if (activeScopes.length > 0) {
    throw new InvalidInput(
      `Cannot delete case with ${activeScopes.length} active scope(s). Please archive or delete all scopes first.`,
    );
  }

  // Validation: Cannot delete completed cases (business rule)
  if (existingCase.status === "completed") {
    throw new InvalidInput("Cannot delete completed cases. Please archive instead.");
  }

  try {
    await createHistoryEntry(deps, {
      caseId: existingCase.id,
      entityType: "case",
      entityId: existingCase.id,
      action: "deleted",
      changesBefore: {
        caseNumber: existingCase.caseNumber,
        clientName: existingCase.clientName,
        status: existingCase.status,
      },
      changedBy: userId,
    });

    await dbDeleteCase(deps, caseId);

    logger.info(
      {
        caseId,
        caseNumber: existingCase.caseNumber,
        organizationId,
        userId,
      },
      "Case deleted successfully",
    );

    return { success: true };
  } catch (err) {
    logger.error({ error: err, caseId, userId }, "Failed to delete case");
    throw new OperationFailed("Failed to delete case");
  }
}
