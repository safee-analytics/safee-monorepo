import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import type { paths } from "../types";
import { queryKeys } from "./queryKeys";
import type { components } from "../types/audit";

// ============================================================================
// Types from Gateway OpenAPI Spec (Single Source of Truth)
// ============================================================================

export type TemplateResponse = components["schemas"]["TemplateResponse"];
export type CreateTemplateRequest = components["schemas"]["CreateTemplateRequest"];
export type TemplateType = components["schemas"]["TemplateType"];
export type CaseCategory = components["schemas"]["CaseCategory"];
export type TemplateStructure = components["schemas"]["TemplateStructure"];

// ============================================================================
// Template Queries
// ============================================================================

/**
 * Get all templates (currently only returns public/system templates)
 *
 * TODO: Backend should be enhanced to support filtering:
 * - Filter by templateType (scope, form, checklist, report, plan)
 * - Filter by category (certification, financial, operational, compliance)
 * - Filter by isActive status
 * - Include organization-specific templates
 * - Include isSystemTemplate filter
 */
export function useTemplates(filters?: {
  templateType?: TemplateType;
  category?: CaseCategory;
  isActive?: boolean;
  includeSystem?: boolean;
  includeOrganization?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.cases.templates,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/templates");
      if (error) throw new Error(handleApiError(error));

      // Client-side filtering until backend supports it
      let filtered = data || [];

      if (filters?.templateType) {
        filtered = filtered.filter((t) => t.templateType === filters.templateType);
      }

      if (filters?.category) {
        filtered = filtered.filter((t) => t.category === filters.category);
      }

      if (filters?.isActive !== undefined) {
        filtered = filtered.filter((t) => t.isActive === filters.isActive);
      }

      if (filters?.includeSystem === false) {
        filtered = filtered.filter((t) => !t.isSystemTemplate);
      }

      return filtered;
    },
  });
}

/**
 * Get a specific template by ID
 */
export function useTemplate(templateId: string) {
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

/**
 * Get templates grouped by category
 * Useful for template library UI
 */
export function useTemplatesByCategory() {
  const { data: templates, ...query } = useTemplates();

  const groupedByCategory = templates?.reduce(
    (acc, template) => {
      const category = template.category || "uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {} as Record<string, TemplateResponse[]>,
  );

  return {
    ...query,
    data: templates,
    groupedByCategory,
  };
}

/**
 * Get system (public) templates only
 */
export function useSystemTemplates() {
  return useTemplates({ includeSystem: true, includeOrganization: false });
}

/**
 * Get organization templates only
 *
 * TODO: Backend needs endpoint for organization-specific templates
 * Currently returns empty array
 */
export function useOrganizationTemplates() {
  return useTemplates({ includeSystem: false, includeOrganization: true });
}

// ============================================================================
// Template Mutations
// ============================================================================

/**
 * Create a new template
 */
export function useCreateTemplate() {
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.templates });
    },
  });
}

/**
 * Update an existing template
 *
 * TODO: Backend needs PUT /cases/templates/{templateId} endpoint
 * This hook is a placeholder for future implementation
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId: _templateId,
      updates: _updates,
    }: {
      templateId: string;
      updates: Partial<CreateTemplateRequest>;
    }) => {
      // TODO: Implement when backend endpoint is available
      // const { data, error } = await apiClient.PUT("/cases/templates/{templateId}", {
      //   params: { path: { templateId: _templateId } },
      //   body: _updates,
      // });
      // if (error) throw new Error(handleApiError(error));
      // return data;

      throw new Error("Update template endpoint not yet implemented in backend");
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.template(variables.templateId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.templates });
    },
  });
}

/**
 * Delete a template
 *
 * TODO: Backend needs DELETE /cases/templates/{templateId} endpoint
 * This hook is a placeholder for future implementation
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_templateId: string) => {
      // TODO: Implement when backend endpoint is available
      // const { data, error } = await apiClient.DELETE("/cases/templates/{templateId}", {
      //   params: { path: { templateId: _templateId } },
      // });
      // if (error) throw new Error(handleApiError(error));
      // return data;

      throw new Error("Delete template endpoint not yet implemented in backend");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.templates });
    },
  });
}

/**
 * Activate/deactivate a template
 *
 * TODO: Backend needs PATCH /cases/templates/{templateId}/status endpoint
 * or use PUT endpoint to update isActive field
 */
export function useToggleTemplateActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId: _templateId, isActive: _isActive }: { templateId: string; isActive: boolean }) => {
      // TODO: Implement when backend endpoint is available
      throw new Error("Toggle template active status endpoint not yet implemented in backend");
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.template(variables.templateId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.templates });
    },
  });
}

/**
 * Duplicate a template
 * Creates a copy with a new name
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  const createTemplate = useCreateTemplate();

  return useMutation({
    mutationFn: async ({ templateId, newName }: { templateId: string; newName: string }) => {
      // Fetch the original template
      const { data: original, error } = await apiClient.GET("/cases/templates/{templateId}", {
        params: { path: { templateId } },
      });

      if (error) throw new Error(handleApiError(error));
      if (!original) throw new Error("Template not found");

      // Create a copy with the new name
      const duplicate: CreateTemplateRequest = {
        name: newName,
        description: `Copy of ${original.name}`,
        templateType: original.templateType,
        category: original.category,
        version: "1.0.0",
        isActive: false, // Start as inactive
        isSystemTemplate: false, // Duplicates are never system templates
        structure: original.structure,
      };

      return createTemplate.mutateAsync(duplicate);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.templates });
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display label for template type
 */
export function getTemplateTypeLabel(type: TemplateType): string {
  const labels: Record<TemplateType, string> = {
    scope: "Scope",
    form: "Form",
    checklist: "Checklist",
    report: "Report",
    plan: "Plan",
  };
  return labels[type];
}

/**
 * Get display label for category
 */
export function getCategoryLabel(category: CaseCategory): string {
  const labels: Record<CaseCategory, string> = {
    certification: "Certification",
    financial: "Financial",
    operational: "Operational",
    compliance: "Compliance",
  };
  return labels[category];
}

/**
 * Count total procedures in a template structure
 */
export function countTemplateProcedures(structure: TemplateStructure): number {
  return structure.sections.reduce((total, section) => total + section.procedures.length, 0);
}

/**
 * Validate template structure before submission
 */
export function validateTemplateStructure(structure: TemplateStructure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!structure.sections || structure.sections.length === 0) {
    errors.push("Template must have at least one section");
  }

  structure.sections.forEach((section, sectionIndex) => {
    if (!section.name || section.name.trim() === "") {
      errors.push(`Section ${sectionIndex + 1} must have a name`);
    }

    if (!section.procedures || section.procedures.length === 0) {
      errors.push(`Section "${section.name}" must have at least one procedure`);
    }

    section.procedures.forEach((procedure, procIndex) => {
      if (!procedure.title || procedure.title.trim() === "") {
        errors.push(
          `Procedure ${procIndex + 1} in section "${section.name}" must have a title`,
        );
      }

      if (!procedure.referenceNumber || procedure.referenceNumber.trim() === "") {
        errors.push(
          `Procedure "${procedure.title}" in section "${section.name}" must have a reference number`,
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a template preview summary
 */
export function getTemplateSummary(template: TemplateResponse): {
  sectionCount: number;
  procedureCount: number;
  typeLabel: string;
  categoryLabel: string;
  isPublic: boolean;
} {
  return {
    sectionCount: template.structure.sections.length,
    procedureCount: countTemplateProcedures(template.structure),
    typeLabel: getTemplateTypeLabel(template.templateType),
    categoryLabel: template.category ? getCategoryLabel(template.category) : "Uncategorized",
    isPublic: template.isSystemTemplate,
  };
}

// ============================================================================
// Re-exports from cases.ts for backwards compatibility
// ============================================================================

export { useCaseTemplates, useCaseTemplate, useCreateCaseTemplate } from "./cases";
