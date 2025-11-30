import { eq, and, desc } from "drizzle-orm";
import { crmLeads } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Lead, CreateLeadInput, UpdateLeadInput } from "./types.js";

export async function createLead(deps: DbDeps, input: CreateLeadInput): Promise<Lead> {
  const [lead] = await deps.drizzle.insert(crmLeads).values(input).returning();
  return lead;
}

export async function getLeadById(deps: DbDeps, leadId: string): Promise<Lead | undefined> {
  return deps.drizzle.query.crmLeads.findFirst({
    where: eq(crmLeads.id, leadId),
  });
}

export async function getLeadByOdooId(
  deps: DbDeps,
  odooLeadId: number,
  organizationId: string,
): Promise<Lead | undefined> {
  return deps.drizzle.query.crmLeads.findFirst({
    where: and(eq(crmLeads.odooLeadId, odooLeadId), eq(crmLeads.organizationId, organizationId)),
  });
}

export async function getLeadsByOrganization(
  deps: DbDeps,
  organizationId: string,
  filters?: {
    type?: string;
    stageId?: number;
    active?: boolean;
  },
): Promise<Lead[]> {
  const conditions = [eq(crmLeads.organizationId, organizationId)];

  if (filters?.type) {
    conditions.push(eq(crmLeads.type, filters.type));
  }
  if (filters?.stageId) {
    conditions.push(eq(crmLeads.stageId, filters.stageId));
  }
  if (filters?.active !== undefined) {
    conditions.push(eq(crmLeads.active, filters.active));
  }

  return deps.drizzle.query.crmLeads.findMany({
    where: and(...conditions),
    orderBy: [desc(crmLeads.createdAt)],
  });
}

export async function updateLead(deps: DbDeps, leadId: string, input: UpdateLeadInput): Promise<Lead> {
  const [updated] = await deps.drizzle
    .update(crmLeads)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(crmLeads.id, leadId))
    .returning();
  return updated;
}

export async function deleteLead(deps: DbDeps, leadId: string): Promise<void> {
  await deps.drizzle.delete(crmLeads).where(eq(crmLeads.id, leadId));
}

export async function syncLead(deps: DbDeps, leadData: CreateLeadInput): Promise<Lead> {
  const existing = leadData.odooLeadId
    ? await getLeadByOdooId(deps, leadData.odooLeadId, leadData.organizationId)
    : undefined;

  if (existing) {
    return updateLead(deps, existing.id, {
      ...leadData,
      lastSyncedAt: new Date(),
    });
  }
  return createLead(deps, {
    ...leadData,
    lastSyncedAt: new Date(),
  });
}
