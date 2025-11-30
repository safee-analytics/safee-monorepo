import { eq } from "drizzle-orm";
import { caseDocuments, type CaseDocument } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { ProcessOcrInput } from "./types.js";

export async function updateDocumentOcrText(
  deps: DbDeps,
  input: ProcessOcrInput,
): Promise<CaseDocument> {
  const [updated] = await deps.drizzle
    .update(caseDocuments)
    .set({
      ocrText: input.extractedText,
      ocrProcessedAt: new Date(),
    })
    .where(eq(caseDocuments.id, input.documentId))
    .returning();

  return updated;
}

export async function getDocumentOcrText(deps: DbDeps, documentId: string): Promise<string | null> {
  const document = await deps.drizzle.query.caseDocuments.findFirst({
    where: eq(caseDocuments.id, documentId),
    columns: {
      ocrText: true,
    },
  });

  return document?.ocrText ?? null;
}

export async function searchDocumentsByOcrText(
  deps: DbDeps,
  caseId: string,
  searchText: string,
): Promise<CaseDocument[]> {
  const documents = await deps.drizzle.query.caseDocuments.findMany({
    where: (docs, { and, eq, ilike }) =>
      and(eq(docs.caseId, caseId), ilike(docs.ocrText, `%${searchText}%`)),
  });

  return documents;
}
