import type { AuditType } from "./cases.js";

export type ReportStatus = "generating" | "ready" | "failed";

export interface AuditReportResponse {
  id: string;
  caseId: string;
  templateId?: string | null;
  title: string;
  status: ReportStatus;
  generatedData?: Record<string, unknown> | null;
  settings?: {
    dateRange?: { start: string | null; end: string };
    includeSections?: string[] | null;
    customizations?: Record<string, unknown> | null;
  } | null;
  filePath?: string | null;
  generatedAt?: Date | null;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditReportRequest {
  caseId: string;
  templateId?: string | null;
  title: string;
  settings?: {
    dateRange?: { start: string | null; end: string };
    includeSections?: string[] | null;
    customizations?: Record<string, unknown> | null;
  };
}

export interface UpdateAuditReportRequest {
  title?: string | null;
  status?: ReportStatus | null;
  generatedData?: Record<string, unknown> | null;
  filePath?: string | null;
  generatedAt?: Date | null;
}

export interface AuditReportTemplateResponse {
  id: string;
  name: string;
  nameAr?: string | null;
  auditType?: AuditType | null;
  description?: string | null;
  descriptionAr?: string | null;
  templateStructure: {
    sections: {
      id: string;
      type: "cover_page" | "text" | "metrics_table" | "findings_list" | "chart" | "appendix";
      title?: string | null;
      titleAr?: string | null;
      dataSource?: string | null;
      config?: Record<string, unknown> | null;
    }[];
    styles?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditReportTemplateRequest {
  name: string;
  nameAr?: string | null;
  auditType?: AuditType | null;
  description?: string | null;
  descriptionAr?: string | null;
  templateStructure: {
    sections: {
      id: string;
      type: "cover_page" | "text" | "metrics_table" | "findings_list" | "chart" | "appendix";
      title?: string | null;
      titleAr?: string | null;
      dataSource?: string | null;
      config?: Record<string, unknown> | null;
    }[];
    styles?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };
  isDefault?: boolean | null;
  isActive?: boolean | null;
}

export interface GenerateReportRequest {
  caseId: string;
  templateId: string;
  title: string;
  titleAr?: string | null;
  settings?: {
    dateRange?: { start: string | null; end: string };
    includeSections?: string[] | null;
    locale?: "en" | "ar" | null;
    customizations?: Record<string, unknown> | null;
  };
}
