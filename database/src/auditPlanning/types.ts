import type { AuditPlan, NewAuditPlan, AuditPlanTemplate, NewAuditPlanTemplate } from "../drizzle/index.js";

export type { AuditPlan, AuditPlanTemplate };

export type CreateAuditPlanInput = Omit<NewAuditPlan, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type UpdateAuditPlanInput = Partial<
  Omit<NewAuditPlan, "id" | "organizationId" | "createdBy" | "createdAt" | "updatedAt" | "deletedAt">
>;

export type CreateAuditPlanTemplateInput = Omit<NewAuditPlanTemplate, "id" | "createdAt" | "updatedAt">;
