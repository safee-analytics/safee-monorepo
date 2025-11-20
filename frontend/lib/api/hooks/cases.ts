import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import type { paths } from "../types";
import { queryKeys } from "./queryKeys";

export type CaseAssignment = {
  role?: string;
  userId?: string;
  user?: {
    name?: string;
    email: string;
  };
};

export type CaseData = {
  id: string;
  caseNumber: string;
  auditType: string;
  clientName: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdBy: string;
  assignments?: CaseAssignment[];
};

export function useCases(filters?: { status?: string; priority?: string; assignedTo?: string }) {
  return useQuery<CaseData[]>({
    queryKey: queryKeys.cases.list(filters),
    queryFn: async () => {
      // Skip the apiClient if no /cases route exists in types, use fetch directly
      const queryParams = filters ? new URLSearchParams(filters as Record<string, string>) : "";
      const response = await fetch(`/api/v1/cases${queryParams ? `?${queryParams}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch cases");
      return response.json();
    },
  });
}

export function useCase(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.detail(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: paths["/cases"]["post"]["requestBody"]["content"]["application/json"]) => {
      const { data, error } = await apiClient.POST("/cases", {
        body: caseData,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      updates,
    }: {
      caseId: string;
      updates: paths["/cases/{caseId}"]["put"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.PUT("/cases/{caseId}", {
        params: {
          path: { caseId },
        },
        body: updates,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { data, error } = await apiClient.DELETE("/cases/{caseId}", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

// Case Templates
export function useCaseTemplates() {
  return useQuery({
    queryKey: queryKeys.cases.templates,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/templates");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useCaseTemplate(templateId: string) {
  return useQuery({
    queryKey: queryKeys.cases.template(templateId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/templates/{templateId}", {
        params: {
          path: { templateId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!templateId,
  });
}

export function useCreateCaseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      template: paths["/cases/templates"]["post"]["requestBody"]["content"]["application/json"],
    ) => {
      const { data, error } = await apiClient.POST("/cases/templates", {
        body: template,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.templates });
    },
  });
}

// Case Scopes
export function useCaseScopes(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.scopes(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/scopes", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      scope,
    }: {
      caseId: string;
      scope: paths["/cases/{caseId}/scopes"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/scopes", {
        params: {
          path: { caseId },
        },
        body: scope,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.scopes(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

export function useCreateScopeFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      templateData,
    }: {
      caseId: string;
      templateData: paths["/cases/{caseId}/scopes/from-template"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/scopes/from-template", {
        params: {
          path: { caseId },
        },
        body: templateData,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.scopes(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

export function useUpdateScopeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      scopeId,
      status,
    }: {
      caseId: string;
      scopeId: string;
      status: paths["/cases/{caseId}/scopes/{scopeId}/status"]["put"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.PUT("/cases/{caseId}/scopes/{scopeId}/status", {
        params: {
          path: { caseId, scopeId },
        },
        body: status,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.scopes(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

// Case Sections
export function useCaseSections(caseId: string, scopeId: string) {
  return useQuery({
    queryKey: queryKeys.cases.sections(caseId, scopeId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/scopes/{scopeId}/sections", {
        params: {
          path: { caseId, scopeId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId && !!scopeId,
  });
}

// Case Procedures
export function useCaseProcedures(caseId: string, scopeId: string, sectionId: string) {
  return useQuery({
    queryKey: queryKeys.cases.procedures(caseId, scopeId, sectionId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/cases/{caseId}/scopes/{scopeId}/sections/{sectionId}/procedures",
        {
          params: {
            path: { caseId, scopeId, sectionId },
          },
        },
      );
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId && !!scopeId && !!sectionId,
  });
}

export function useCompleteProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      scopeId,
      sectionId,
      procedureId,
      completion,
    }: {
      caseId: string;
      scopeId: string;
      sectionId: string;
      procedureId: string;
      completion: paths["/cases/{caseId}/scopes/{scopeId}/sections/{sectionId}/procedures/{procedureId}/complete"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST(
        "/cases/{caseId}/scopes/{scopeId}/sections/{sectionId}/procedures/{procedureId}/complete",
        {
          params: {
            path: { caseId, scopeId, sectionId, procedureId },
          },
          body: completion,
        },
      );
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.procedures(variables.caseId, variables.scopeId, variables.sectionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.sections(variables.caseId, variables.scopeId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.scopes(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

// Case Documents
export function useCaseDocuments(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.documents(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/documents", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useUploadCaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      document,
    }: {
      caseId: string;
      document: paths["/cases/{caseId}/documents"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/documents", {
        params: {
          path: { caseId },
        },
        body: document,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.documents(variables.caseId) });
    },
  });
}

export function useDeleteCaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, documentId }: { caseId: string; documentId: string }) => {
      const { data, error } = await apiClient.DELETE("/cases/{caseId}/documents/{documentId}", {
        params: {
          path: { caseId, documentId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.documents(variables.caseId) });
    },
  });
}

// Case Notes
export function useCaseNotes(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.notes(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/notes", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useAddCaseNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      note,
    }: {
      caseId: string;
      note: paths["/cases/{caseId}/notes"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/notes", {
        params: {
          path: { caseId },
        },
        body: note,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.notes(variables.caseId) });
    },
  });
}

export function useUpdateCaseNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      noteId,
      updates,
    }: {
      caseId: string;
      noteId: string;
      updates: paths["/cases/{caseId}/notes/{noteId}"]["put"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.PUT("/cases/{caseId}/notes/{noteId}", {
        params: {
          path: { caseId, noteId },
        },
        body: updates,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.notes(variables.caseId) });
    },
  });
}

// Case Assignments
export function useCaseAssignments(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.assignments(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/assignments", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useAssignCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      assignment,
    }: {
      caseId: string;
      assignment: paths["/cases/{caseId}/assignments"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/assignments", {
        params: {
          path: { caseId },
        },
        body: assignment,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.assignments(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

export function useRemoveCaseAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, userId }: { caseId: string; userId: string }) => {
      const { data, error } = await apiClient.DELETE("/cases/{caseId}/assignments/{userId}", {
        params: {
          path: { caseId, userId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.assignments(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

// Case History
export function useCaseHistory(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.history(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/history", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

// ============================================================================
