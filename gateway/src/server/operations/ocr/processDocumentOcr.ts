import type { DbDeps } from "@safee/database";
import { updateDocumentOcrText } from "@safee/database";
import type { ProcessOcrRequest } from "../../dtos/ocr.js";

export async function processDocumentOcr(
  deps: DbDeps,
  request: ProcessOcrRequest,
  _fileBuffer: Buffer,
): Promise<{ extractedText: string; confidence: number }> {
  const extractedText = "";
  const confidence = 0;

  await updateDocumentOcrText(deps, {
    documentId: request.documentId,
    extractedText,
  });

  return {
    extractedText,
    confidence,
  };
}
