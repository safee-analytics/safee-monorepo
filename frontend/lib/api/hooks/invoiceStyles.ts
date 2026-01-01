import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { components } from "../types/settings";
import { type InvoiceStyle, invoiceStyleSchema } from "@/lib/validation";

type DocumentTemplateResponse = components["schemas"]["DocumentTemplateResponse"];

// TODO: [Backend] - Provide default invoice styles from the backend
//   Details: The `DEFAULT_STYLES` object is currently hardcoded in the frontend. This should be moved to the backend to ensure consistency and allow for easier updates.
//   Priority: Medium
const DEFAULT_STYLES: Omit<InvoiceStyle, "organizationId" | "id"> = {
  logoPosition: "left",
  primaryColor: "#3B82F6",
  accentColor: "#8B5CF6",
  textColor: "#1F2937",
  backgroundColor: "#FFFFFF",
  headingFont: "Inter",
  bodyFont: "Inter",
  fontSize: "medium",
  showLogo: true,
  showCompanyDetails: true,
  showFooter: true,
  footerText: "Thank you for your business!",
  invoiceLabel: "INVOICE",
  dateLabel: "DATE",
  dueLabel: "DUE DATE",
  billToLabel: "BILL TO",
  itemLabel: "ACTIVITY",
  quantityLabel: "QTY",
  rateLabel: "RATE",
  amountLabel: "AMOUNT",
  totalLabel: "BALANCE DUE",
};

/**
 * Get invoice styles for organization (from active invoice template)
 */
export function useInvoiceStyles(orgId: string) {
  return useQuery({
    queryKey: ["invoice-styles", orgId],
    queryFn: async () => {
      try {
        // Get active invoice template
        const { data: activeTemplate, error } = await apiClient.GET("/settings/document-templates/active", {
          params: { query: { documentType: "invoice" } },
        });

        if (error || !activeTemplate?.templateId) {
          // Return defaults if no active template
          return invoiceStyleSchema.parse({
            organizationId: orgId,
            ...DEFAULT_STYLES,
          });
        }

        // Get template details
        const { data: templates, error: templatesError } = await apiClient.GET(
          "/settings/document-templates/by-type",
          {
            params: { query: { documentType: "invoice" } },
          },
        );

        if (templatesError || !templates) {
          return invoiceStyleSchema.parse({
            organizationId: orgId,
            ...DEFAULT_STYLES,
          });
        }

        const template = templates.find((t: DocumentTemplateResponse) => t.isActive);
        if (!template?.customizations) {
          return invoiceStyleSchema.parse({
            organizationId: orgId,
            ...DEFAULT_STYLES,
          });
        }

        // Extract style customizations
        return invoiceStyleSchema.parse({
          organizationId: orgId,
          id: template.id,
          ...DEFAULT_STYLES,
          ...(template.customizations.styles || {}),
        });
      } catch {
        // Fallback to defaults on error
        return invoiceStyleSchema.parse({
          organizationId: orgId,
          ...DEFAULT_STYLES,
        });
      }
    },
    enabled: !!orgId,
  });
}

/**
 * Save invoice styles (updates active template customizations)
 */
export function useSaveInvoiceStyles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (styles: InvoiceStyle) => {
      // Get or create active invoice template
      const { data: activeTemplate } = await apiClient.GET("/settings/document-templates/active", {
        params: { query: { documentType: "invoice" } },
      });

      if (!activeTemplate?.templateId) {
        // Create a new template if none exists
        const { data: newTemplate, error: createError } = await apiClient.POST(
          "/settings/document-templates",
          {
            body: {
              documentType: "invoice",
              templateId: "default_invoice_template",
              templateName: "Default Invoice",
              templateDescription: "Default invoice template with custom styling",
              isActive: true,
              customizations: {
                styles,
              },
            },
          },
        );

        if (createError) throw new Error(handleApiError(createError));
        return newTemplate;
      }

      // Update existing template
      const { data: templates } = await apiClient.GET("/settings/document-templates/by-type", {
        params: { query: { documentType: "invoice" } },
      });

      const activeTemplateDetails = templates?.find((t: DocumentTemplateResponse) => t.isActive);
      if (!activeTemplateDetails) {
        throw new Error("Active template not found");
      }

      const { data: updatedTemplate, error: updateError } = await apiClient.PUT(
        "/settings/document-templates/{templateId}",
        {
          params: { path: { templateId: activeTemplateDetails.id } },
          body: {
            customizations: {
              ...activeTemplateDetails.customizations,
              styles,
            },
          },
        },
      );

      if (updateError) throw new Error(handleApiError(updateError));
      return updatedTemplate;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["invoice-styles", variables.organizationId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.documentTemplates() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.activeTemplate("invoice") });
    },
  });
}
