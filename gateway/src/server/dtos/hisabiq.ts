/**
 * Hisabiq (Accounting) API Response Types
 *
 * These are simplified types for API responses that TSOA can handle.
 * Internal Odoo types use tuples [number, string] which TSOA doesn't support.
 * All fields use camelCase naming convention for JavaScript/TypeScript APIs.
 */

export interface PaymentResponse {
  id?: number;
  paymentType: "inbound" | "outbound" | "transfer";
  partnerType: "customer" | "supplier";
  partnerId: number;
  partnerName?: string;
  amount: number;
  currencyId?: number;
  paymentDate: string;
  journalId: number;
  journalName?: string;
  paymentMethodId?: number;
  ref?: string;
  state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
}

export interface PartnerResponse {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  vat?: string;
  accountReceivableId?: number;
  accountPayableId?: number;
  paymentTermId?: number;
  customerRank?: number;
  supplierRank?: number;
}

export interface JournalResponse {
  id: number;
  name: string;
  code: string;
  type: "sale" | "purchase" | "cash" | "bank" | "general";
  currencyId?: number;
  currencyName?: string;
  companyId: number;
  companyName?: string;
  defaultAccountId: number;
  defaultAccountName?: string;
}

export interface TaxResponse {
  id: number;
  name: string;
  amount: number;
  amountType: "percent" | "division" | "fixed" | "group";
  typeTaxUse: "sale" | "purchase" | "none";
  active: boolean;
}

export interface GLEntryResponse {
  id: number;
  moveId: number;
  moveName?: string;
  date: string;
  accountId: number;
  accountName?: string;
  partnerId?: number;
  partnerName?: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
  amountCurrency?: number;
  currencyId?: number;
  currencyName?: string;
  companyId: number;
  companyName?: string;
}

export interface AccountBalanceReportResponse {
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface PartnerLedgerEntryResponse {
  date: string;
  moveName: string;
  label: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface PartnerLedgerReportResponse {
  partnerId: number;
  partnerName: string;
  debit: number;
  credit: number;
  balance: number;
  entries: PartnerLedgerEntryResponse[];
}

export interface ProfitLossResponse {
  income: number;
  expenses: number;
  netProfit: number;
}
