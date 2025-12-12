import type { DrizzleClient } from "@safee/database";
import {
  getCaseById,
  getTemplateById,
  createScopeFromTemplate as dbCreateScopeFromTemplate,
  createHistoryEntry,
} from "@safee/database";
import { pino } from "pino";
import { OperationFailed, NotFound, InsufficientPermissions, InvalidInput } from "../../errors.js";
import type { ScopeResponse } from "../../dtos/cases.js";

export async function createScopeFromTemplate(
  drizzle: DrizzleClient,
  organizationId: string,
  userId: string,
  caseId: string,
  templateId: string,
): Promise<ScopeResponse> {
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
    throw new InsufficientPermissions("You don't have permission to create scopes for this case");
  }

  let template;
  try {
    template = await getTemplateById(deps, templateId);
  } catch {
    throw new NotFound("Template not found");
  }

  if (!template) {
    throw new NotFound("Template not found");
  }

  // Validation: Template must be public OR belong to the same organization
  if (!template.isPublic && template.organizationId !== organizationId) {
    throw new InsufficientPermissions("You don't have permission to use this template");
  }

  // Validation: Template must be active
  if (!template.isActive) {
    throw new InvalidInput("Cannot create scope from inactive template");
  }

  // Validation: Audit types should match (optional warning, not blocking)
  if (template.auditType !== existingCase.auditType) {
    logger.warn(
      {
        templateAuditType: template.auditType,
        caseAuditType: existingCase.auditType,
        caseId,
        templateId,
      },
      "Template audit type does not match case audit type",
    );
  }

  try {
    const scope = await dbCreateScopeFromTemplate(deps, caseId, templateId, userId);

    await createHistoryEntry(deps, {
      caseId,
      entityType: "scope",
      entityId: scope.id,
      action: "created",
      changesAfter: {
        scopeName: scope.name,
        templateId: template.id,
        templateName: template.name,
        sectionsCount: template.structure.sections.length,
      },
      changedBy: userId,
    });

    logger.info(
      {
        caseId,
        scopeId: scope.id,
        templateId,
        templateName: template.name,
        userId,
      },
      "Scope created from template successfully",
    );

    return {
      id: scope.id,
      caseId: scope.caseId,
      templateId: scope.templateId ,
      name: scope.name,
      description: scope.description ,
      status: scope.status,
      metadata: scope.metadata!,
      createdBy: scope.createdBy,
      completedBy: scope.completedBy ,
      archivedBy: scope.archivedBy ,
      createdAt: scope.createdAt.toISOString(),
      updatedAt: scope.updatedAt.toISOString(),
      completedAt: scope.completedAt?.toISOString(),
      archivedAt: scope.archivedAt?.toISOString(),
    };
  } catch (err) {
    logger.error({ error: err, caseId, templateId, userId }, "Failed to create scope from template");
    throw new OperationFailed("Failed to create scope from template");
  }
}
