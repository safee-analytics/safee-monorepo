import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";

export type PlanType = "standalone" | "case_integrated";
export type PlanStatus = "draft" | "in_review" | "approved" | "converted" | "archived";
export type AuditType =
  | "financial_audit"
  | "compliance_audit"
  | "operational_audit"
  | "it_audit"
  | "internal_controls"
  | "risk_assessment";

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
  objectives?: { id: string; description: string; priority?: string }[] | null;
  businessUnits?: Record<string, boolean> | null;
  financialAreas?: Record<string, boolean> | null;
  teamMembers?: { userId: string; name: string; role: string; hours?: number }[] | null;
  phaseBreakdown?: {
    name: string;
    duration: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[] | null;
  totalBudget?: string;
  totalHours?: number;
  materialityThreshold?: string;
  riskAssessment?: {
    risks?: { type: string; severity: string; message: string }[];
    overallRisk?: string;
    score?: number;
  } | null;
  status: PlanStatus;
  organizationId: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
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
  objectives?: { id: string; description: string; priority?: string }[];
  businessUnits?: Record<string, boolean>;
  financialAreas?: Record<string, boolean>;
  teamMembers?: { userId: string; name: string; role: string; hours?: number }[];
  phaseBreakdown?: {
    name: string;
    duration: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[];
  totalBudget?: string;
  totalHours?: number;
  materialityThreshold?: string;
  riskAssessment?: {
    risks?: { type: string; severity: string; message: string }[];
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
  objectives?: { id: string; description: string; priority?: string }[];
  businessUnits?: Record<string, boolean>;
  financialAreas?: Record<string, boolean>;
  teamMembers?: { userId: string; name: string; role: string; hours?: number }[];
  phaseBreakdown?: {
    name: string;
    duration: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[];
  totalBudget?: string;
  totalHours?: number;
  materialityThreshold?: string;
  riskAssessment?: {
    risks?: { type: string; severity: string; message: string }[];
    overallRisk?: string;
    score?: number;
  };
  status?: PlanStatus;
}

export interface AuditPlanTemplateResponse {
  id: string;
  name: string;
  auditType?: AuditType;
  description?: string;
  defaultObjectives?: { id: string; description: string; priority?: string }[] | null;
  defaultScope?: Record<string, unknown> | null;
  defaultPhases?: { name: string; duration: number; description?: string }[] | null;
  defaultBusinessUnits?: Record<string, boolean> | null;
  defaultFinancialAreas?: Record<string, boolean> | null;
  estimatedDuration?: number;
  estimatedHours?: number;
  estimatedBudget?: string;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Hooks

export function useAuditPlans() {
  return useQuery({
    queryKey: queryKeys.auditPlans.all(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/audit-plans", {});
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanResponse[];
    },
  });
}

export function useAuditPlan(planId: string) {
  return useQuery({
    queryKey: queryKeys.auditPlans.detail(planId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/audit-plans/{planId}", {
        params: {
          path: { planId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanResponse;
    },
    enabled: !!planId,
  });
}

export function useCreateAuditPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAuditPlanRequest) => {
      const { data, error } = await apiClient.POST("/audit-plans", {
        body: request as never,
      });
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditPlans.all() });
    },
  });
}

export function useUpdateAuditPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, request }: { planId: string; request: UpdateAuditPlanRequest }) => {
      const { data, error } = await apiClient.PUT("/audit-plans/{planId}", {
        params: {
          path: { planId },
        },
        body: request as never,
      });
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanResponse;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditPlans.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditPlans.detail(variables.planId) });
    },
  });
}

export function useDeleteAuditPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data, error } = await apiClient.DELETE("/audit-plans/{planId}", {
        params: {
          path: { planId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditPlans.all() });
    },
  });
}

export function useConvertPlanToCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data, error } = await apiClient.POST("/audit-plans/{planId}/convert-to-case", {
        params: {
          path: { planId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { caseId: string; message: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditPlans.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

export function useAuditPlanTemplates() {
  return useQuery({
    queryKey: queryKeys.auditPlans.templates(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/audit-plans/templates");
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanTemplateResponse[];
    },
  });
}

export function useAuditPlanTemplate(templateId: string) {
  return useQuery({
    queryKey: queryKeys.auditPlans.template(templateId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/audit-plans/templates/{templateId}", {
        params: {
          path: { templateId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanTemplateResponse;
    },
    enabled: !!templateId,
  });
}

export function useCreatePlanFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      templateId: string;
      title: string;
      clientName?: string;
      auditYear?: number;
      startDate?: string;
    }) => {
      const { data, error } = await apiClient.POST("/audit-plans/from-template", {
        body: request as never,
      });
      if (error) throw new Error(handleApiError(error));
      return data as AuditPlanResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditPlans.all() });
    },
  });
}
