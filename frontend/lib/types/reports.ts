export type ReportStatus = "generating" | "ready" | "failed";

export type SectionType = "cover_page" | "text" | "metrics_table" | "findings_list" | "chart" | "appendix";

export interface ReportTemplate {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  auditType: string;
  preview: string;
}

export interface ReportSection {
  id: string;
  type: SectionType;
  title?: string;
  titleAr?: string;
  dataSource?: string;
  required: boolean;
}

export interface DataSourceConfig {
  caseId: string;
  dateRange: {
    start: string;
    end: string;
  };
  includeDrafts: boolean;
}

export interface GenerateReportRequest {
  caseId: string;
  templateId: string;
  title: string;
  titleAr?: string;
  settings?: {
    dateRange?: { start: string; end: string };
    includeSections?: string[];
    locale?: "en" | "ar";
    customizations?: Record<string, unknown>;
  };
}

export interface AuditReportResponse {
  id: string;
  caseId: string;
  templateId?: string;
  title: string;
  status: ReportStatus;
  generatedData?: Record<string, unknown> | null;
  settings?: {
    dateRange?: { start: string; end: string };
    includeSections?: string[];
    customizations?: Record<string, unknown>;
  } | null;
  filePath?: string;
  generatedAt?: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
}
