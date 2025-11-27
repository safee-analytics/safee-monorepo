import type { AuditType } from "./cases.js";

export type PlanType = "standalone" | "case_integrated";
export type PlanStatus = "draft" | "in_review" | "approved" | "converted" | "archived";

export interface AuditPlanResponse {
  id: string;
  caseId?: string;
  planType: PlanType;
  title: string;
  clientName?: string;
  auditType?: AuditType;
  auditYear?: number;
  startDate?: string;
  targetCompletion?: string;
  objectives?: Array<{ id: string; description: string; priority?: string }> | null;
  businessUnits?: Record<string, boolean> | null;
  financialAreas?: Record<string, boolean> | null;
  teamMembers?: Array<{ userId: string; name: string; role: string; hours?: number }> | null;
  phaseBreakdown?: Array<{
    name: string;
    duration: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }> | null;
  totalBudget?: string;
  totalHours?: number;
  materialityThreshold?: string;
  riskAssessment?: {
    risks?: Array<{ type: string; severity: string; message: string }>;
    overallRisk?: string;
    score?: number;
  } | null;
  status: PlanStatus;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditPlanRequest {
  caseId?: string;
  planType?: PlanType;
  title: string;
  clientName?: string;
  auditType?: AuditType;
  auditYear?: number;
  startDate?: string;
  targetCompletion?: string;
  objectives?: Array<{ id: string; description: string; priority?: string }>;
  businessUnits?: Record<string, boolean>;
  financialAreas?: Record<string, boolean>;
  teamMembers?: Array<{ userId: string; name: string; role: string; hours?: number }>;
  phaseBreakdown?: Array<{
    name: string;
    duration: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }>;
  totalBudget?: string;
  totalHours?: number;
  materialityThreshold?: string;
  riskAssessment?: {
    risks?: Array<{ type: string; severity: string; message: string }>;
    overallRisk?: string;
    score?: number;
  };
  status?: PlanStatus;
}

export interface UpdateAuditPlanRequest {
  caseId?: string;
  planType?: PlanType;
  title?: string;
  clientName?: string;
  auditType?: AuditType;
  auditYear?: number;
  startDate?: string;
  targetCompletion?: string;
  objectives?: Array<{ id: string; description: string; priority?: string }>;
  businessUnits?: Record<string, boolean>;
  financialAreas?: Record<string, boolean>;
  teamMembers?: Array<{ userId: string; name: string; role: string; hours?: number }>;
  phaseBreakdown?: Array<{
    name: string;
    duration: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }>;
  totalBudget?: string;
  totalHours?: number;
  materialityThreshold?: string;
  riskAssessment?: {
    risks?: Array<{ type: string; severity: string; message: string }>;
    overallRisk?: string;
    score?: number;
  };
  status?: PlanStatus;
}

export interface ConvertPlanToCaseRequest {
  planId: string;
}

export interface AuditPlanTemplateResponse {
  id: string;
  name: string;
  auditType?: AuditType;
  description?: string;
  defaultObjectives?: Array<{ id: string; description: string; priority?: string }> | null;
  defaultScope?: Record<string, unknown> | null;
  defaultPhases?: Array<{ name: string; duration: number; description?: string }> | null;
  defaultBusinessUnits?: Record<string, boolean> | null;
  defaultFinancialAreas?: Record<string, boolean> | null;
  estimatedDuration?: number;
  estimatedHours?: number;
  estimatedBudget?: string;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditPlanTemplateRequest {
  name: string;
  auditType?: AuditType;
  description?: string;
  defaultObjectives?: Array<{ id: string; description: string; priority?: string }>;
  defaultScope?: Record<string, unknown>;
  defaultPhases?: Array<{ name: string; duration: number; description?: string }>;
  defaultBusinessUnits?: Record<string, boolean>;
  defaultFinancialAreas?: Record<string, boolean>;
  estimatedDuration?: number;
  estimatedHours?: number;
  estimatedBudget?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreatePlanFromTemplateRequest {
  templateId: string;
  title: string;
  clientName?: string;
  auditYear?: number;
  startDate?: string;
}
