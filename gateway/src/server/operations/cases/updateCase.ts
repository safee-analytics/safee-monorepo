import type { DrizzleClient } from "@safee/database";
import { getCaseById, updateCase as dbUpdateCase, createHistoryEntry } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound, InsufficientPermissions } from "../../errors.js";
import type { UpdateCaseRequest, CaseResponse } from "../../dtos/cases.js";

export async function updateCase(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  caseId: string,
  request: UpdateCaseRequest,
): Promise<CaseResponse> {
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
    throw new InsufficientPermissions("You don't have permission to update this case");
  }

  // Validation: Case number format if provided
  if (request.caseNumber && !/^[A-Z0-9-]+$/.test(request.caseNumber)) {
    throw new InvalidInput("Case number must contain only uppercase letters, numbers, and hyphens");
  }

  // Validation: Case number length
  if (request.caseNumber && (request.caseNumber.length < 3 || request.caseNumber.length > 50)) {
    throw new InvalidInput("Case number must be between 3 and 50 characters");
  }

  // Validation: Client name
  if (request.clientName !== undefined && request.clientName.trim().length === 0) {
    throw new InvalidInput("Client name cannot be empty");
  }

  // Validation: Audit type
  if (request.auditType !== undefined && request.auditType.trim().length === 0) {
    throw new InvalidInput("Audit type cannot be empty");
  }

  // Validation: Due date
  if (request.dueDate) {
    const dueDate = new Date(request.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      throw new InvalidInput("Due date cannot be in the past");
    }
  }

  // Validation: Completed date logic
  if (request.completedDate && request.status !== "completed") {
    throw new InvalidInput("Completed date can only be set when status is 'completed'");
  }

  if (request.status === "completed" && !request.completedDate && !existingCase.completedDate) {
    request.completedDate = new Date().toISOString();
  }

  // Validation: Cannot change status to archived if case has active scopes
  if (request.status === "archived") {
    // TODO: Check for active scopes and prevent archiving
    // This would require importing and using getScopesByCase
  }

  try {
    const changesBefore: Record<string, unknown> = {};
    const changesAfter: Record<string, unknown> = {};

    if (request.caseNumber && request.caseNumber !== existingCase.caseNumber) {
      changesBefore.caseNumber = existingCase.caseNumber;
      changesAfter.caseNumber = request.caseNumber;
    }
    if (request.clientName && request.clientName !== existingCase.clientName) {
      changesBefore.clientName = existingCase.clientName;
      changesAfter.clientName = request.clientName;
    }
    if (request.status && request.status !== existingCase.status) {
      changesBefore.status = existingCase.status;
      changesAfter.status = request.status;
    }
    if (request.priority && request.priority !== existingCase.priority) {
      changesBefore.priority = existingCase.priority;
      changesAfter.priority = request.priority;
    }

    const updated = await dbUpdateCase(deps, caseId, {
      ...request,
      caseNumber: request.caseNumber?.trim(),
      clientName: request.clientName?.trim(),
      auditType: request.auditType?.trim(),
      dueDate: request.dueDate ? new Date(request.dueDate) : undefined,
      completedDate: request.completedDate ? new Date(request.completedDate) : undefined,
    });

    if (Object.keys(changesAfter).length > 0) {
      await createHistoryEntry(deps, {
        caseId: updated.id,
        entityType: "case",
        entityId: updated.id,
        action: "updated",
        changesBefore,
        changesAfter,
        changedBy: userId,
      });
    }

    logger.info(
      {
        caseId: updated.id,
        changes: changesAfter,
        userId,
      },
      "Case updated successfully",
    );

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      caseNumber: updated.caseNumber,
      clientName: updated.clientName,
      auditType: updated.auditType,
      status: updated.status,
      priority: updated.priority,
      dueDate: updated.dueDate?.toISOString(),
      completedDate: updated.completedDate?.toISOString(),
      createdBy: updated.createdBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (err) {
    logger.error({ error: err, caseId, userId, request }, "Failed to update case");

    if (err instanceof Error && err.message.includes("unique constraint")) {
      throw new InvalidInput("A case with this case number already exists");
    }

    throw new OperationFailed("Failed to update case");
  }
}
