import type { DrizzleClient } from "@safee/database";
import { createCase as dbCreateCase, createHistoryEntry, schema, eq, and } from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput } from "../../errors.js";
import type { CreateCaseRequest, CaseResponse } from "../../dtos/cases.js";

export async function createCase(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  request: CreateCaseRequest,
): Promise<CaseResponse> {
  const logger = pino();

  // Validation: Case number format
  if (!/^[A-Z0-9-]+$/.test(request.caseNumber)) {
    throw new InvalidInput("Case number must contain only uppercase letters, numbers, and hyphens");
  }

  // Validation: Case number length
  if (request.caseNumber.length < 3 || request.caseNumber.length > 50) {
    throw new InvalidInput("Case number must be between 3 and 50 characters");
  }

  // Validation: Client name
  if (request.clientName.trim().length === 0) {
    throw new InvalidInput("Client name cannot be empty");
  }

  // Validation: Audit type
  if (request.auditType.trim().length === 0) {
    throw new InvalidInput("Audit type cannot be empty");
  }

  // Validation: Due date must be in the future if provided
  if (request.dueDate) {
    const dueDate = new Date(request.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      throw new InvalidInput("Due date cannot be in the past");
    }
  }

  try {
    const deps = { drizzle, logger };

    // Validation: Check for duplicate case number in the organization
    const existingCase = await drizzle.query.cases.findFirst({
      where: and(
        eq(schema.cases.organizationId, organizationId),
        eq(schema.cases.caseNumber, request.caseNumber),
      ),
    });

    if (existingCase) {
      throw new InvalidInput("A case with this case number already exists");
    }

    // Create the case
    const newCase = await dbCreateCase(deps, {
      organizationId,
      caseNumber: request.caseNumber,
      clientName: request.clientName.trim(),
      auditType: request.auditType.trim(),
      status: request.status ?? "pending",
      priority: request.priority ?? "medium",
      dueDate: request.dueDate ? new Date(request.dueDate) : undefined,
      createdBy: userId,
    });

    // Create history entry for case creation
    await createHistoryEntry(deps, {
      caseId: newCase.id,
      entityType: "case",
      entityId: newCase.id,
      action: "created",
      changesAfter: {
        caseNumber: newCase.caseNumber,
        clientName: newCase.clientName,
        auditType: newCase.auditType,
        status: newCase.status,
        priority: newCase.priority,
      },
      changedBy: userId,
    });

    logger.info(
      {
        caseId: newCase.id,
        caseNumber: newCase.caseNumber,
        organizationId,
        userId,
      },
      "Case created successfully",
    );

    return {
      id: newCase.id,
      organizationId: newCase.organizationId,
      caseNumber: newCase.caseNumber,
      clientName: newCase.clientName,
      auditType: newCase.auditType,
      status: newCase.status,
      priority: newCase.priority,
      dueDate: newCase.dueDate?.toISOString(),
      completedDate: newCase.completedDate?.toISOString(),
      createdBy: newCase.createdBy,
      createdAt: newCase.createdAt.toISOString(),
      updatedAt: newCase.updatedAt.toISOString(),
    };
  } catch (err) {
    // Re-throw validation errors as-is
    if (err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, request }, "Failed to create case");
    throw new OperationFailed("Failed to create case");
  }
}
