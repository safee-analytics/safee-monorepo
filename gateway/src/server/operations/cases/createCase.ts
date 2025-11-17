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

  let caseNumber = request.caseNumber;
  if (!caseNumber) {
    const latestCase = await drizzle.query.cases.findFirst({
      where: eq(schema.cases.organizationId, organizationId),
      orderBy: (cases, { desc }) => [desc(cases.createdAt)],
    });

    let nextNumber = 1;
    if (latestCase?.caseNumber) {
      const match = latestCase.caseNumber.match(/CASE-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    caseNumber = `CASE-${String(nextNumber).padStart(3, "0")}`;
  }

  // Validation: Case number format (if provided manually)
  if (request.caseNumber && !/^[A-Z0-9-]+$/.test(caseNumber)) {
    throw new InvalidInput("Case number must contain only uppercase letters, numbers, and hyphens");
  }

  // Validation: Case number length
  if (caseNumber.length < 3 || caseNumber.length > 50) {
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
      where: and(eq(schema.cases.organizationId, organizationId), eq(schema.cases.caseNumber, caseNumber)),
    });

    if (existingCase) {
      throw new InvalidInput("A case with this case number already exists");
    }

    const newCase = await dbCreateCase(deps, {
      organizationId,
      caseNumber,
      clientName: request.clientName.trim(),
      auditType: request.auditType.trim(),
      status: request.status ?? "pending",
      priority: request.priority ?? "medium",
      dueDate: request.dueDate ? new Date(request.dueDate) : undefined,
      createdBy: userId,
    });

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
    if (err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, organizationId, userId, request }, "Failed to create case");
    throw new OperationFailed("Failed to create case");
  }
}
