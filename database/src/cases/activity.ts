import { schema, eq, desc, DbDeps } from "../index.js";

const { cases } = schema;

export interface CaseActivity {
  id: string;
  type: "case_update";
  caseId: string;
  caseNumber: string;
  clientName: string;
  status: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

export async function getRecentCaseActivity(
  deps: DbDeps,
  organizationId: string,
  limit = 10,
): Promise<CaseActivity[]> {
  const { drizzle } = deps;

  const recentCases = await drizzle.query.cases.findMany({
    where: eq(cases.organizationId, organizationId),
    orderBy: [desc(cases.updatedAt)],
    limit,
    with: {
      creator: true,
    },
  });

  return recentCases.map((c) => ({
    id: c.id,
    type: "case_update" as const,
    caseId: c.id,
    caseNumber: c.caseNumber,
    clientName: c.clientName,
    status: c.status,
    updatedAt: c.updatedAt.toISOString(),
    updatedBy: {
      id: c.creator.id,
      name: c.creator.name ?? c.creator.email,
    },
  }));
}
