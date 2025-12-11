import type { AuditType } from "./cases.js";

export type ReportStatus = "generating" | "ready" | "failed";

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
  generatedAt?: Date;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditReportRequest {
  caseId: string;
  templateId?: string;
  title: string;
  settings?: {
    dateRange?: { start: string; end: string };
    includeSections?: string[];
    customizations?: Record<string, unknown>;
  };
}

export interface UpdateAuditReportRequest {
  title?: string;
  status?: ReportStatus;
  generatedData?: Record<string, unknown>;
  filePath?: string;
  generatedAt?: Date;
}

export interface AuditReportTemplateResponse {
  id: string;
  name: string;
  nameAr?: string;
  auditType?: AuditType;
  description?: string;
  descriptionAr?: string;
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
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditReportTemplateRequest {
  name: string;
  nameAr?: string;
  auditType?: AuditType;
  description?: string;
  descriptionAr?: string;
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
  isDefault?: boolean;
  isActive?: boolean;
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
