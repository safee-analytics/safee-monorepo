import { schema, eq, and, count, DbDeps } from "../index.js";

const { cases } = schema;

export interface CaseStats {
  activeCases: number;
  pendingReviews: number;
  completedAudits: number;
  totalCases: number;
  completionRate: number;
}

export async function getCaseStats(deps: DbDeps, organizationId: string): Promise<CaseStats> {
  const { drizzle } = deps;

  const [activeCasesResult] = await drizzle
    .select({ count: count() })
    .from(cases)
    .where(and(eq(cases.organizationId, organizationId), eq(cases.status, "in_progress")));

  const [pendingReviewsResult] = await drizzle
    .select({ count: count() })
    .from(cases)
    .where(and(eq(cases.organizationId, organizationId), eq(cases.status, "under_review")));

  const [completedAuditsResult] = await drizzle
    .select({ count: count() })
    .from(cases)
    .where(and(eq(cases.organizationId, organizationId), eq(cases.status, "completed")));

  const [totalCasesResult] = await drizzle
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.organizationId, organizationId));

  const activeCases = activeCasesResult.count;
  const pendingReviews = pendingReviewsResult.count;
  const completedAudits = completedAuditsResult.count;
  const totalCases = totalCasesResult.count;

  const completionRate = totalCases > 0 ? Math.round((completedAudits / totalCases) * 100) : 0;

  return {
    activeCases,
    pendingReviews,
    completedAudits,
    totalCases,
    completionRate,
  };
}
