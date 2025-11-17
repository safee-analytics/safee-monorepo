import type { DrizzleClient } from "@safee/database";
import {
  getProcedureById,
  completeProcedure as dbCompleteProcedure,
  createHistoryEntry,
} from "@safee/database";
import { pino } from "pino";
import { OperationFailed, NotFound, InvalidInput } from "../../errors.js";
import type { CompleteProcedureRequest, ProcedureResponse } from "../../dtos/cases.js";

export async function completeProcedure(
  drizzle: DrizzleClient,
  userId: string,
  caseId: string,
  procedureId: string,
  request: CompleteProcedureRequest,
): Promise<ProcedureResponse> {
  const logger = pino();
  const deps = { drizzle, logger };

  let existingProcedure;
  try {
    existingProcedure = await getProcedureById(deps, procedureId);
  } catch (err) {
    logger.error({ error: err }, "Failed to get procedure");
    throw new NotFound("Procedure not found");
  }

  if (!existingProcedure) {
    throw new NotFound("Procedure not found");
  }

  // Validation: Cannot complete if already completed
  if (existingProcedure.isCompleted) {
    throw new InvalidInput("Procedure is already completed");
  }

  // Validation: Cannot complete if not editable
  if (!existingProcedure.canEdit) {
    throw new InvalidInput("This procedure cannot be edited");
  }

  // Validation: Check requirements
  const requirements = existingProcedure.requirements as Record<string, unknown>;

  if (requirements.isRequired && !request.fieldData) {
    throw new InvalidInput("Field data is required for this procedure");
  }

  if (requirements.requiresObservations && !request.memo) {
    throw new InvalidInput("Observations/memo is required for this procedure");
  }

  // TODO: Validate custom fields based on requirements.customFields
  // TODO: Validate attachments based on requirements.minAttachments

  try {
    // Complete the procedure
    const completed = await dbCompleteProcedure(deps, procedureId, {
      completedBy: userId,
      fieldData: request.fieldData,
      memo: request.memo,
    });

    await createHistoryEntry(deps, {
      caseId,
      entityType: "procedure",
      entityId: procedureId,
      action: "completed",
      changesBefore: {
        isCompleted: false,
      },
      changesAfter: {
        isCompleted: true,
        completedBy: userId,
        hasFieldData: !!request.fieldData,
        hasMemo: !!request.memo,
      },
      changedBy: userId,
    });

    logger.info(
      {
        caseId,
        procedureId,
        referenceNumber: completed.referenceNumber,
        userId,
      },
      "Procedure completed successfully",
    );

    return {
      id: completed.id,
      sectionId: completed.sectionId,
      referenceNumber: completed.referenceNumber,
      title: completed.title,
      description: completed.description ?? undefined,
      requirements: completed.requirements as Record<string, unknown>,
      sortOrder: completed.sortOrder,
      isCompleted: completed.isCompleted,
      completedBy: completed.completedBy ?? undefined,
      completedAt: completed.completedAt?.toISOString(),
      memo: completed.memo ?? undefined,
      fieldData: completed.fieldData as Record<string, unknown>,
      canEdit: completed.canEdit,
      createdAt: completed.createdAt.toISOString(),
      updatedAt: completed.updatedAt.toISOString(),
    };
  } catch (err) {
    logger.error({ error: err, procedureId, userId }, "Failed to complete procedure");
    throw new OperationFailed("Failed to complete procedure");
  }
}
