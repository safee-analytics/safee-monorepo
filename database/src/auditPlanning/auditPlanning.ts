import { eq, and, desc, asc, isNull, or } from "drizzle-orm";
import { auditPlans, auditPlanTemplates } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type {
  AuditPlan,
  AuditPlanTemplate,
  CreateAuditPlanInput,
  UpdateAuditPlanInput,
  CreateAuditPlanTemplateInput,
} from "./types.js";

export async function createAuditPlan(deps: DbDeps, input: CreateAuditPlanInput): Promise<AuditPlan> {
  const [newPlan] = await deps.drizzle.insert(auditPlans).values(input).returning();
  return newPlan;
}

export async function getAuditPlanById(deps: DbDeps, planId: string): Promise<AuditPlan | undefined> {
  return deps.drizzle.query.auditPlans.findFirst({
    where: eq(auditPlans.id, planId),
  });
}

export async function getAuditPlansByOrganization(
  deps: DbDeps,
  organizationId: string,
): Promise<AuditPlan[]> {
  return deps.drizzle.query.auditPlans.findMany({
    where: eq(auditPlans.organizationId, organizationId),
    orderBy: [desc(auditPlans.createdAt)],
  });
}

export async function updateAuditPlan(
  deps: DbDeps,
  planId: string,
  input: UpdateAuditPlanInput,
): Promise<AuditPlan> {
  const [updatedPlan] = await deps.drizzle
    .update(auditPlans)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(auditPlans.id, planId))
    .returning();
  return updatedPlan;
}

export async function deleteAuditPlan(deps: DbDeps, planId: string): Promise<void> {
  await deps.drizzle.update(auditPlans).set({ deletedAt: new Date() }).where(eq(auditPlans.id, planId));
}

export async function createAuditPlanTemplate(
  deps: DbDeps,
  input: CreateAuditPlanTemplateInput,
): Promise<AuditPlanTemplate> {
  const [template] = await deps.drizzle.insert(auditPlanTemplates).values(input).returning();
  return template;
}

export async function getAuditPlanTemplateById(
  deps: DbDeps,
  templateId: string,
): Promise<AuditPlanTemplate | undefined> {
  return deps.drizzle.query.auditPlanTemplates.findFirst({
    where: eq(auditPlanTemplates.id, templateId),
  });
}

export async function getAuditPlanTemplates(
  deps: DbDeps,
  organizationId?: string,
): Promise<AuditPlanTemplate[]> {
  if (organizationId) {
    return deps.drizzle.query.auditPlanTemplates.findMany({
      where: and(
        eq(auditPlanTemplates.isActive, true),
        or(eq(auditPlanTemplates.organizationId, organizationId), isNull(auditPlanTemplates.organizationId)),
      ),
      orderBy: [desc(auditPlanTemplates.isDefault), asc(auditPlanTemplates.name)],
    });
  }

  return deps.drizzle.query.auditPlanTemplates.findMany({
    where: eq(auditPlanTemplates.isActive, true),
    orderBy: [desc(auditPlanTemplates.isDefault), asc(auditPlanTemplates.name)],
  });
}
