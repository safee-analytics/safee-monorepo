import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { paths } from "../types";

type DocumentType =
  | "invoice"
  | "bill"
  | "quote"
  | "purchase_order"
  | "delivery_note"
  | "receipt"
  | "credit_note"
  | "debit_note"
  | "payslip"
  | "contract"
  | "payment_receipt"
  | "refund";

type DocumentTemplateResponse =
  paths["/settings/document-templates"]["get"]["responses"]["200"]["content"]["application/json"][number];

type OdooReportTemplate =
  paths["/settings/document-templates/odoo-templates"]["get"]["responses"]["200"]["content"]["application/json"][number];

// ==================== Get Templates ====================

export function useDocumentTemplates() {
  return useQuery({
    queryKey: queryKeys.settings.documentTemplates(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/settings/document-templates");
      if (error) throw new Error(handleApiError(error));
      return data as DocumentTemplateResponse[];
    },
  });
}

export function useDocumentTemplatesByType(documentType: DocumentType) {
  return useQuery({
    queryKey: queryKeys.settings.documentTemplatesByType(documentType),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/settings/document-templates/by-type", {
        params: { query: { documentType } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as DocumentTemplateResponse[];
    },
    enabled: !!documentType,
  });
}

export function useActiveTemplate(documentType: DocumentType) {
  return useQuery({
    queryKey: queryKeys.settings.activeTemplate(documentType),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/settings/document-templates/active", {
        params: { query: { documentType } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { templateId: string };
    },
    enabled: !!documentType,
  });
}

export function useOdooTemplates(model?: string) {
  return useQuery({
    queryKey: queryKeys.settings.odooTemplates(model),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/settings/document-templates/odoo-templates", {
        params: { query: model ? { model } : undefined },
      });
      if (error) throw new Error(handleApiError(error));
      return data as OdooReportTemplate[];
    },
  });
}

// ==================== Mutations ====================

export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      documentType: DocumentType;
      templateId: string;
      templateName: string;
      templateDescription?: string;
      isActive?: boolean;
      customizations?: Record<string, unknown>;
    }) => {
      const { data, error } = await apiClient.POST("/settings/document-templates", {
        body: template,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.documentTemplates() });
    },
  });
}

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      ...updates
    }: {
      templateId: string;
      templateName?: string;
      templateDescription?: string;
      customizations?: Record<string, unknown>;
    }) => {
      const { data, error } = await apiClient.PUT("/settings/document-templates/{templateId}", {
        params: { path: { templateId } },
        body: updates,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.documentTemplates() });
    },
  });
}

export function useActivateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await apiClient.POST("/settings/document-templates/{templateId}/activate", {
        params: { path: { templateId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.documentTemplates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.activeTemplate() });
    },
  });
}

export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await apiClient.DELETE("/settings/document-templates/{templateId}", {
        params: { path: { templateId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.documentTemplates() });
    },
  });
}

export function useCreateCustomTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      documentType: DocumentType;
      templateName: string;
      templateDescription?: string;
      qwebXml: string;
      model: string;
      isActive?: boolean;
      customizations?: Record<string, unknown>;
    }) => {
      const { data, error } = await apiClient.POST("/settings/document-templates/custom", {
        body: template,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.documentTemplates() });
    },
  });
}
