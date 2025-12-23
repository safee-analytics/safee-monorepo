/**
 * Accounting DTOs for TSOA
 * These mirror the types from @safee/database but are defined explicitly for TSOA metadata generation
 */

export interface CreateInvoiceDTO {
  moveType?: "out_invoice" | "in_invoice" | "out_refund" | "in_refund";
  customerId?: number;
  supplierId?: number;
  invoiceDate?: string;
  dueDate?: string;
  reference?: string;
  notes?: string;
  paymentTermId?: number;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxIds?: number[];
    productId?: number;
  }[];
}

export interface CreateRefundDTO {
  reason?: string;
  date?: string;
  journalId?: number;
}

export interface CreatePaymentDTO {
  type: "inbound" | "outbound";
  partnerId: number;
  partnerType: "customer" | "supplier";
  amount: number;
  date: string;
  journalId: number;
  reference?: string;
  invoiceIds?: number[];
}

export interface AccountBalanceQuery {
  accountIds?: number[];
  dateFrom?: string;
  dateTo?: string;
}

export interface PartnerLedgerQuery {
  partnerId: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface FinancialReportQuery {
  reportType: "balance_sheet" | "profit_loss" | "cash_flow";
  dateFrom?: string;
  dateTo?: string;
  comparisonDateFrom?: string;
  comparisonDateTo?: string;
}
