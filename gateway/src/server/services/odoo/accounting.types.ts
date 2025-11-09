/**
 * Odoo Accounting Type Definitions
 *
 * These types map to Odoo's accounting models for type-safe operations
 */

export interface OdooAccount {
  id: number;
  code: string;
  name: string;
  account_type:
    | "asset_receivable"
    | "asset_cash"
    | "asset_current"
    | "asset_non_current"
    | "asset_prepayments"
    | "asset_fixed"
    | "liability_payable"
    | "liability_credit_card"
    | "liability_current"
    | "liability_non_current"
    | "equity"
    | "equity_unaffected"
    | "income"
    | "income_other"
    | "expense"
    | "expense_depreciation"
    | "expense_direct_cost"
    | "off_balance";
  currency_id?: [number, string];
  company_id: [number, string];
  group_id?: [number, string];
  deprecated?: boolean;
}

export interface OdooInvoiceLine {
  product_id?: number;
  name: string;
  quantity: number;
  price_unit: number;
  discount?: number;
  tax_ids?: Array<[6, false, number[]]>; // Odoo many2many format
  account_id?: number;
  analytic_distribution?: Record<string, number>; // Cost center distribution
}

export interface OdooInvoice {
  id?: number;
  name?: string; // Invoice number (auto-generated)
  move_type: "out_invoice" | "out_refund" | "in_invoice" | "in_refund" | "entry";
  partner_id: number; // Customer/Supplier ID
  invoice_date?: string; // YYYY-MM-DD
  invoice_date_due?: string; // YYYY-MM-DD
  payment_reference?: string;
  currency_id?: number;
  invoice_line_ids: Array<[0, 0, OdooInvoiceLine]>; // Odoo one2many create format
  state?: "draft" | "posted" | "cancel";
  amount_untaxed?: number;
  amount_tax?: number;
  amount_total?: number;
  amount_residual?: number; // Amount due
  payment_state?: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
  journal_id?: number;
  company_id?: number;
  invoice_origin?: string; // Reference (e.g., Sales Order number)
  narration?: string; // Internal notes
}

export interface OdooPayment {
  id?: number;
  name?: string;
  payment_type: "inbound" | "outbound" | "transfer";
  partner_type: "customer" | "supplier";
  partner_id: number | [number, string];
  amount: number;
  amount_signed?: number;
  amount_company_currency_signed?: number;
  currency_id: number | [number, string];
  company_currency_id?: number | [number, string];
  date: string; // YYYY-MM-DD (was payment_date)
  journal_id: number | [number, string]; // Bank/Cash journal
  payment_method_line_id?: number | [number, string];
  payment_method_id?: number | [number, string];
  payment_method_code?: string;
  memo?: string; // Payment reference (was ref)
  payment_reference?: string;
  state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
  is_reconciled?: boolean;
  is_matched?: boolean;
  partner_bank_id?: number | [number, string];
  destination_account_id?: number | [number, string];
  outstanding_account_id?: number | [number, string];
  move_id?: number | [number, string];
  reconciled_invoice_ids?: number[];
  reconciled_invoices_count?: number;
  qr_code?: string;
}

export interface OdooJournal {
  id: number;
  name: string;
  code: string;
  type: "sale" | "purchase" | "cash" | "bank" | "general";
  currency_id?: [number, string];
  company_id: [number, string];
  default_account_id: [number, string];
}

export interface OdooPartner {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  vat?: string; // Tax ID
  property_account_receivable_id?: [number, string];
  property_account_payable_id?: [number, string];
  property_payment_term_id?: [number, string];
  customer_rank?: number;
  supplier_rank?: number;
}

export interface OdooTax {
  id: number;
  name: string;
  amount: number;
  amount_type: "percent" | "division" | "fixed" | "group";
  type_tax_use: "sale" | "purchase" | "none";
  active: boolean;
}

export interface OdooGLEntry {
  id: number;
  move_id: [number, string];
  date: string;
  account_id: [number, string];
  partner_id?: [number, string];
  name: string; // Entry label
  debit: number;
  credit: number;
  balance: number;
  amount_currency?: number;
  currency_id?: [number, string];
  company_id: [number, string];
}

// Report Types

export interface OdooAccountBalanceReport {
  account_id: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface OdooPartnerLedgerReport {
  partner_id: number;
  partner_name: string;
  debit: number;
  credit: number;
  balance: number;
  entries: Array<{
    date: string;
    move_name: string;
    label: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
}

export interface OdooFinancialReport {
  lines: Array<{
    name: string;
    level: number;
    balance: number;
    account_type?: string;
  }>;
}

// DTOs for API requests

export interface CreateInvoiceDTO {
  customerId: number;
  invoiceDate?: string;
  dueDate?: string;
  reference?: string;
  notes?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxIds?: number[];
    productId?: number;
  }>;
}

export interface CreatePaymentDTO {
  type: "inbound" | "outbound";
  partnerId: number;
  partnerType: "customer" | "supplier";
  amount: number;
  date: string;
  journalId: number;
  reference?: string;
  invoiceIds?: number[]; // Invoices to pay
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
