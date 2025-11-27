export interface ProcessOcrRequest {
  documentId: string;
  language?: string;
}

export interface OcrResponse {
  documentId: string;
  extractedText: string;
  processedAt: Date;
}

export interface DocumentSearchRequest {
  caseId: string;
  searchText: string;
}

export interface DocumentSearchResult {
  id: string;
  fileName: string;
  fileType: string;
  ocrText: string | null;
  uploadedAt: Date;
}
