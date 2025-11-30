export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
}

export interface ProcessOcrInput {
  documentId: string;
  extractedText: string;
}
