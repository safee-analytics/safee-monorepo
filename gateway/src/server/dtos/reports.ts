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
    dateRange?: { start: string; end: string };
    includeSections?: string[];
    customizations?: Record<string, unknown>;
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
  settings?: {
    dateRange?: { start: string; end: string };
    includeSections?: string[];
    customizations?: Record<string, unknown>;
  } | null;
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
      title?: string;
      titleAr?: string;
      dataSource?: string;
      config?: Record<string, unknown>;
    }[];
    styles?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
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
      title?: string;
      titleAr?: string;
      dataSource?: string;
      config?: Record<string, unknown>;
    }[];
    styles?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
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
    dateRange?: { start: string; end: string };
    includeSections?: string[];
    locale?: "en" | "ar" | null;
    customizations?: Record<string, unknown>;
  };
}
