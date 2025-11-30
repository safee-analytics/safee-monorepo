import { Controller, Post, Get, Route, Tags, Security, Body, Path, Request } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type {
  ProcessOcrRequest,
  OcrResponse,
  DocumentSearchRequest,
  DocumentSearchResult,
} from "../dtos/ocr.js";
import { updateDocumentOcrText, getDocumentOcrText, searchDocumentsByOcrText } from "@safee/database";

@Route("ocr")
@Tags("OCR")
export class OcrController extends Controller {
  @Post("/process")
  @Security("jwt")
  public async processDocument(
    @Request() req: AuthenticatedRequest,
    @Body() request: ProcessOcrRequest,
  ): Promise<OcrResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const document = await updateDocumentOcrText(deps, {
      documentId: request.documentId,
      extractedText: "",
    });

    return {
      documentId: document.id,
      extractedText: document.ocrText ?? "",
      processedAt: document.ocrProcessedAt ?? new Date(),
    };
  }

  @Get("/document/{documentId}")
  @Security("jwt")
  public async getDocumentText(
    @Request() req: AuthenticatedRequest,
    @Path() documentId: string,
  ): Promise<{ documentId: string; text: string | null }> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const text = await getDocumentOcrText(deps, documentId);

    return {
      documentId,
      text,
    };
  }

  @Post("/search")
  @Security("jwt")
  public async searchDocuments(
    @Request() req: AuthenticatedRequest,
    @Body() request: DocumentSearchRequest,
  ): Promise<DocumentSearchResult[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const documents = await searchDocumentsByOcrText(deps, request.caseId, request.searchText);

    return documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      ocrText: doc.ocrText,
      uploadedAt: doc.uploadedAt,
    }));
  }
}
