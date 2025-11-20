import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

/**
 * Get invoice styles for organization
 */
export function useInvoiceStyles(orgId: string) {
  return useQuery({
    queryKey: ["invoice-styles", orgId],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint when backend is ready
      const stored = localStorage.getItem(`invoice-styles-${orgId}`);
      if (stored) {
        return JSON.parse(stored) as InvoiceStyle;
      }

      // Default styles
      return {
        organizationId: orgId,
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
      } as InvoiceStyle;
    },
    enabled: !!orgId,
  });
}

/**
 * Save invoice styles
 */
export function useSaveInvoiceStyles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (styles: InvoiceStyle) => {
      // TODO: Replace with actual API endpoint when backend is ready
      localStorage.setItem(`invoice-styles-${styles.organizationId}`, JSON.stringify(styles));
      return styles;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-styles", variables.organizationId] });
    },
  });
}
