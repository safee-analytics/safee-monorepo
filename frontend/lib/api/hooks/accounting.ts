import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";

// ==================== Invoices ====================

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  type?: "SALES" | "PURCHASE";
  state?: "draft" | "posted" | "cancel";
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.accounting.invoices(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/invoices", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: queryKeys.accounting.invoice(invoiceId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/invoices/{invoiceId}", {
        params: { path: { invoiceId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: {
      type: "SALES" | "PURCHASE";
      customerId?: string;
      supplierId?: string;
      date: string;
      dueDate?: string;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
      }>;
    }) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices", {
        body: invoice,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useValidateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices/{invoiceId}/validate", {
        params: { path: { invoiceId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoice(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices/{invoiceId}/cancel", {
        params: { path: { invoiceId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoice(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useRefundInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      ...body
    }: {
      invoiceId: string;
      reason?: string;
      date?: string;
      journalId?: number;
    }) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices/{invoiceId}/refund", {
        params: { path: { invoiceId } },
        body,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useInvoicePDF(invoiceId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/invoices/{invoiceId}/pdf", {
        params: { path: { invoiceId } },
        parseAs: "blob",
      });
      if (error) throw new Error(handleApiError(error));

      // Download the PDF
      const blob = data as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      return data;
    },
  });
}

// ==================== Bills ====================

export function useBills(params?: {
  page?: number;
  limit?: number;
  state?: "draft" | "posted" | "cancel";
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.accounting.bills(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/bills", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useBill(billId: string) {
  return useQuery({
    queryKey: queryKeys.accounting.bill(billId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/bills/{billId}", {
        params: { path: { billId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!billId,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: {
      type: "PURCHASE";
      supplierId: string;
      date: string;
      dueDate?: string;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
      }>;
    }) => {
      const { data, error } = await apiClient.POST("/hisabiq/bills", {
        body: bill,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.bills() });
    },
  });
}

export function useValidateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billId: string) => {
      const { data, error } = await apiClient.POST("/hisabiq/bills/{billId}/validate", {
        params: { path: { billId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, billId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.bill(billId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.bills() });
    },
  });
}

export function useCancelBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billId: string) => {
      const { data, error } = await apiClient.POST("/hisabiq/bills/{billId}/cancel", {
        params: { path: { billId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, billId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.bill(billId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.bills() });
    },
  });
}

// ==================== Payments ====================

export function usePayments(params?: {
  type?: "inbound" | "outbound" | "transfer";
  state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.accounting.payments(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/payments", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      type: "inbound" | "outbound";
      partnerId: number;
      partnerType: "customer" | "supplier";
      amount: number;
      date: string;
      journalId: number;
      reference?: string;
      invoiceIds?: number[];
    }) => {
      const { data, error } = await apiClient.POST("/hisabiq/payments", {
        body: payment,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.payments() });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await apiClient.POST("/hisabiq/payments/{paymentId}/confirm", {
        params: { path: { paymentId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.payments() });
    },
  });
}

// ==================== Master Data ====================

export function useAccounts(accountType?: string) {
  return useQuery({
    queryKey: queryKeys.accounting.accounts(accountType),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/accounts", {
        params: { query: { accountType } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function usePartners(filters?: { isCustomer?: boolean; isSupplier?: boolean }) {
  return useQuery({
    queryKey: queryKeys.accounting.partners(filters),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/partners", {
        params: { query: filters },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useJournals(type?: "sale" | "purchase" | "cash" | "bank" | "general") {
  return useQuery({
    queryKey: queryKeys.accounting.journals(type),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/journals", {
        params: { query: { type } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useTaxes(typeTaxUse?: "sale" | "purchase" | "none") {
  return useQuery({
    queryKey: queryKeys.accounting.taxes(typeTaxUse),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/taxes", {
        params: { query: { typeTaxUse } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function usePaymentTerms() {
  return useQuery({
    queryKey: queryKeys.accounting.paymentTerms,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/payment-terms");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

// ==================== Reports ====================

export function useTrialBalance(params: { accountIds?: number[]; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: queryKeys.accounting.reports.trialBalance(params),
    queryFn: async () => {
      const { data, error } = await apiClient.POST("/hisabiq/reports/trial-balance", {
        body: params,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function usePartnerLedger(params: { partnerId: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: queryKeys.accounting.reports.partnerLedger(params),
    queryFn: async () => {
      const { data, error } = await apiClient.POST("/hisabiq/reports/partner-ledger", {
        body: params,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!params.partnerId,
  });
}

export function useProfitLoss(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: queryKeys.accounting.reports.profitLoss(dateFrom, dateTo),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/reports/profit-loss", {
        params: { query: { dateFrom, dateTo } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useGeneralLedger(params?: {
  accountId?: number;
  partnerId?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.accounting.reports.generalLedger(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/general-ledger", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useAgedReceivable(asOfDate?: string) {
  return useQuery({
    queryKey: queryKeys.accounting.reports.agedReceivable(asOfDate),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/reports/aged-receivable", {
        params: { query: { asOfDate } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useAgedPayable(asOfDate?: string) {
  return useQuery({
    queryKey: queryKeys.accounting.reports.agedPayable(asOfDate),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/reports/aged-payable", {
        params: { query: { asOfDate } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

// ==================== Bank Reconciliation ====================

export function useBankStatements(params?: {
  journalId?: number;
  dateFrom?: string;
  dateTo?: string;
  state?: "open" | "confirm";
}) {
  return useQuery({
    queryKey: queryKeys.accounting.bankStatements(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/bank-statements", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useBankStatementLines(statementId: number) {
  return useQuery({
    queryKey: queryKeys.accounting.bankStatementLines(statementId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/bank-statements/{statementId}/lines", {
        params: { path: { statementId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!statementId,
  });
}

export function useReconciliationSuggestions(lineId: number) {
  return useQuery({
    queryKey: queryKeys.accounting.reconciliationSuggestions(lineId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/bank-statements/lines/{lineId}/suggestions", {
        params: { path: { lineId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!lineId,
  });
}

export function useReconcileBankLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lineId, moveIds }: { lineId: number; moveIds: number[] }) => {
      const { data, error } = await apiClient.POST("/hisabiq/bank-statements/lines/{lineId}/reconcile", {
        params: { path: { lineId } },
        body: { moveIds },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.bankStatements() });
    },
  });
}

// ==================== Multi-Currency ====================

export function useCurrencies(onlyActive: boolean = true) {
  return useQuery({
    queryKey: queryKeys.accounting.currencies(onlyActive),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/currencies", {
        params: { query: { onlyActive } },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useCurrencyRates(params?: { currencyId?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: queryKeys.accounting.currencyRates(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hisabiq/currency-rates", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useConvertCurrency() {
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      fromCurrencyId: number;
      toCurrencyId: number;
      date?: string;
    }) => {
      const { data, error } = await apiClient.POST("/hisabiq/currency-convert", {
        body: params,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

// ==================== Batch Operations ====================

export function useBatchValidateInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceIds: number[]) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices/batch-validate", {
        body: { invoiceIds },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useBatchCancelInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceIds: number[]) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices/batch-cancel", {
        body: { invoiceIds },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useBatchCreateInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      invoices: Array<{
        type: "SALES" | "PURCHASE";
        customerId?: string;
        supplierId?: string;
        date: string;
        dueDate?: string;
        items: Array<{
          description: string;
          quantity: number;
          unitPrice: number;
        }>;
      }>,
    ) => {
      const { data, error } = await apiClient.POST("/hisabiq/invoices/batch-create", {
        body: { invoices },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.invoices() });
    },
  });
}

export function useBatchConfirmPayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentIds: number[]) => {
      const { data, error } = await apiClient.POST("/hisabiq/payments/batch-confirm", {
        body: { paymentIds },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.payments() });
    },
  });
}
