import type { AuditType } from "./cases.js";

export type PlanType = "standalone" | "case_integrated";
export type PlanStatus = "draft" | "in_review" | "approved" | "converted" | "archived";

export interface AuditPlanResponse {
  id: string;
  caseId?: string | null;
  planType: PlanType;
  title: string;
  clientName?: string | null;
  auditType?: AuditType | null;
  auditYear?: number | null;
  startDate?: string | null;
  targetCompletion?: string | null;
  objectives?: { id: string | null; description: string; priority?: string }[] | null;
  businessUnits?: Record<string, boolean> | null;
  financialAreas?: Record<string, boolean> | null;
  teamMembers?: { userId: string | null; name: string; role: string; hours?: number }[] | null;
  phaseBreakdown?:
    | {
        name: string | null;
        duration: number;
        description?: string | null;
        startDate?: string | null;
        endDate?: string | null;
      }[]
    | null;
  totalBudget?: string | null;
  totalHours?: number | null;
  materialityThreshold?: string | null;
  riskAssessment?: {
    risks?: { type: string | null; severity: string; message: string }[];
    overallRisk?: string | null;
    score?: number | null;
  } | null;
  status: PlanStatus;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditPlanRequest {
  caseId?: string | null;
  planType?: PlanType | null;
  title: string;
  clientName?: string | null;
  auditType?: AuditType | null;
  auditYear?: number | null;
  startDate?: string | null;
  targetCompletion?: string | null;
  objectives?: { id: string | null; description: string; priority?: string }[];
  businessUnits?: Record<string, boolean> | null;
  financialAreas?: Record<string, boolean> | null;
  teamMembers?: { userId: string | null; name: string; role: string; hours?: number }[];
  phaseBreakdown?: {
    name: string | null;
    duration: number;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }[];
  totalBudget?: string | null;
  totalHours?: number | null;
  materialityThreshold?: string | null;
  riskAssessment?: {
    risks?: { type: string | null; severity: string; message: string }[];
    overallRisk?: string | null;
    score?: number | null;
  };
  status?: PlanStatus | null;
}

export interface UpdateAuditPlanRequest {
  caseId?: string | null;
  planType?: PlanType | null;
  title?: string | null;
  clientName?: string | null;
  auditType?: AuditType | null;
  auditYear?: number | null;
  startDate?: string | null;
  targetCompletion?: string | null;
  objectives?: { id: string | null; description: string; priority?: string }[];
  businessUnits?: Record<string, boolean> | null;
  financialAreas?: Record<string, boolean> | null;
  teamMembers?: { userId: string | null; name: string; role: string; hours?: number }[];
  phaseBreakdown?: {
    name: string | null;
    duration: number;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }[];
  totalBudget?: string | null;
  totalHours?: number | null;
  materialityThreshold?: string | null;
  riskAssessment?: {
    risks?: { type: string | null; severity: string; message: string }[];
    overallRisk?: string | null;
    score?: number | null;
  };
  status?: PlanStatus | null;
}

export interface ConvertPlanToCaseRequest {
  planId: string;
}

export interface AuditPlanTemplateResponse {
  id: string;
  name: string;
  auditType?: AuditType | null;
  description?: string | null;
  defaultObjectives?: { id: string | null; description: string; priority?: string }[] | null;
  defaultScope?: Record<string, unknown> | null;
  defaultPhases?: { name: string | null; duration: number; description?: string }[] | null;
  defaultBusinessUnits?: Record<string, boolean> | null;
  defaultFinancialAreas?: Record<string, boolean> | null;
  estimatedDuration?: number | null;
  estimatedHours?: number | null;
  estimatedBudget?: string | null;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditPlanTemplateRequest {
  name: string;
  auditType?: AuditType | null;
  description?: string | null;
  defaultObjectives?: { id?: string | null; description: string; priority?: string }[];
  defaultScope?: Record<string, unknown> | null;
  defaultPhases?: { name: string | null; duration: number; description?: string }[];
  defaultBusinessUnits?: Record<string, boolean> | null;
  defaultFinancialAreas?: Record<string, boolean> | null;
  estimatedDuration?: number | null;
  estimatedHours?: number | null;
  estimatedBudget?: string | null;
  isDefault?: boolean | null;
  isActive?: boolean | null;
}

export interface CreatePlanFromTemplateRequest {
  templateId: string;
  title: string;
  clientName?: string | null;
  auditYear?: number | null;
  startDate?: string | null;
}
