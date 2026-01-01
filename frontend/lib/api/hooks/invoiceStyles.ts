import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { components } from "../types/settings";

type DocumentTemplateResponse = components["schemas"]["DocumentTemplateResponse"];

export interface InvoiceStyle {
  id?: string;
  organizationId: string;

  // Logo
  logoUrl?: string;
  logoPosition: "left" | "center" | "right";

  // Colors
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;

  // Fonts
  headingFont: string;
  bodyFont: string;
  fontSize: "small" | "medium" | "large";

  // Layout
  showLogo: boolean;
  showCompanyDetails: boolean;
  showFooter: boolean;
  footerText: string;

  // Labels
  invoiceLabel: string;
  dateLabel: string;
  dueLabel: string;
  billToLabel: string;
  itemLabel: string;
  quantityLabel: string;
  rateLabel: string;
  amountLabel: string;
  totalLabel: string;
}

const DEFAULT_STYLES: Omit<InvoiceStyle, "organizationId"> = {
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
          return {
            organizationId: orgId,
            ...DEFAULT_STYLES,
          } as InvoiceStyle;
        }

        // Get template details
        const { data: templates, error: templatesError } = await apiClient.GET(
          "/settings/document-templates/by-type",
          {
            params: { query: { documentType: "invoice" } },
          },
        );

        if (templatesError || !templates) {
          return {
            organizationId: orgId,
            ...DEFAULT_STYLES,
          } as InvoiceStyle;
        }

        const template = templates.find((t: DocumentTemplateResponse) => t.isActive);
        if (!template?.customizations) {
          return {
            organizationId: orgId,
            ...DEFAULT_STYLES,
          } as InvoiceStyle;
        }

        // Extract style customizations
        return {
          organizationId: orgId,
          id: template.id,
          ...DEFAULT_STYLES,
          ...(template.customizations.styles || {}),
        } as InvoiceStyle;
      } catch {
        // Fallback to defaults on error
        return {
          organizationId: orgId,
          ...DEFAULT_STYLES,
        } as InvoiceStyle;
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
