/**
 * Odoo Accounting Service
 *
 * High-level wrapper for Odoo accounting operations.
 * Provides type-safe methods for managing:
 * - Chart of Accounts
 * - Invoices (Sales & Purchase)
 * - Payments
 * - Financial Reports
 */

import { z } from "zod";
import type { OdooClient } from "./client.service.js";
import type {
  OdooAccount,
  OdooInvoice,
  OdooInvoiceLine,
  OdooPayment,
  OdooJournal,
  OdooPartner,
  OdooTax,
  OdooGLEntry,
  OdooAccountBalanceReport,
  OdooPartnerLedgerReport,
  CreateInvoiceDTO,
  CreatePaymentDTO,
  AccountBalanceQuery,
  PartnerLedgerQuery,
} from "./accounting.types.js";
import {
  odooInvoiceReadSchema,
  odooInvoiceLineReadSchema,
  odooPaymentReadSchema,
  odooPartnerReadSchema,
  odooJournalReadSchema,
  odooTaxReadSchema,
  odooGLEntryReadSchema,
  type OdooInvoiceRead,
  type OdooInvoiceLineRead,
} from "./accounting.validation.js";

export class OdooAccountingService {
  constructor(private readonly client: OdooClient) {}

  // ==================== Chart of Accounts ====================

  /**
   * Get all accounts or filter by criteria
   */
  async getAccounts(filters?: {
    accountType?: string;
    onlyActive?: boolean;
  }): Promise<OdooAccount[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (filters?.accountType) {
      domain.push(["account_type", "=", filters.accountType]);
    }
    if (filters?.onlyActive !== false) {
      // By default, only show active accounts (active=true means not deprecated)
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooAccount>("account.account", domain, [
      "code",
      "name",
      "description",
      "account_type",
      "internal_group",
      "currency_id",
      "company_currency_id",
      "group_id",
      "root_id",
      "active",
      "used",
      "reconcile",
      "current_balance",
      "opening_debit",
      "opening_credit",
      "opening_balance",
      "tax_ids",
      "tag_ids",
      "note",
      "non_trade",
      "include_initial_balance",
    ]);
  }

  /**
   * Get a single account by ID
   */
  async getAccount(accountId: number): Promise<OdooAccount | null> {
    const accounts = await this.client.read<OdooAccount>("account.account", [accountId], [
      "code",
      "name",
      "description",
      "account_type",
      "internal_group",
      "currency_id",
      "company_currency_id",
      "group_id",
      "root_id",
      "active",
      "used",
      "reconcile",
      "current_balance",
      "opening_debit",
      "opening_credit",
      "opening_balance",
      "tax_ids",
      "tag_ids",
      "note",
      "non_trade",
      "include_initial_balance",
    ]);
    return accounts[0] || null;
  }

  /**
   * Search for accounts by code or name
   */
  async searchAccounts(query: string): Promise<OdooAccount[]> {
    return this.client.searchRead<OdooAccount>(
      "account.account",
      [
        "&",
        ["active", "=", true], // Only active accounts
        "|",
        ["code", "ilike", query],
        ["name", "ilike", query],
      ],
      [
        "code",
        "name",
        "description",
        "account_type",
        "currency_id",
        "group_id",
        "active",
        "current_balance",
        "reconcile",
        "tax_ids",
      ],
      { limit: 50 },
    );
  }

  // ==================== Invoices ====================

  /**
   * Get invoices with filters
   */
  async getInvoices(filters?: {
    moveType?: "out_invoice" | "out_refund" | "in_invoice" | "in_refund";
    partnerId?: number;
    state?: "draft" | "posted" | "cancel";
    paymentState?: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooInvoice[]> {
    const domain: Array<string | [string, string, unknown]> = [];

    if (filters?.moveType) {
      domain.push(["move_type", "=", filters.moveType]);
    }
    if (filters?.partnerId) {
      domain.push(["partner_id", "=", filters.partnerId]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }
    if (filters?.paymentState) {
      domain.push(["payment_state", "=", filters.paymentState]);
    }
    if (filters?.dateFrom) {
      domain.push(["invoice_date", ">=", filters.dateFrom]);
    }
    if (filters?.dateTo) {
      domain.push(["invoice_date", "<=", filters.dateTo]);
    }

    return this.client.searchRead<OdooInvoice>(
      "account.move",
      domain,
      [
        "name",
        "move_type",
        "partner_id",
        "commercial_partner_id",
        "partner_shipping_id",
        "invoice_date",
        "invoice_date_due",
        "delivery_date",
        "invoice_origin",
        "ref",
        "payment_reference",
        "invoice_payment_term_id",
        "fiscal_position_id",
        "invoice_user_id",
        "invoice_incoterm_id",
        "incoterm_location",
        "narration",
        "state",
        "payment_state",
        "amount_untaxed",
        "amount_tax",
        "amount_total",
        "amount_residual",
        "amount_untaxed_signed",
        "amount_total_signed",
        "currency_id",
        "company_currency_id",
        "journal_id",
        "company_id",
        "invoice_line_ids",
        "tax_totals",
        "is_move_sent",
      ],
      { order: "invoice_date desc" },
    );
  }

  /**
   * Get a single invoice by ID with line items
   */
  async getInvoice(invoiceId: number): Promise<OdooInvoiceRead | null> {
    const rawInvoices = await this.client.read(
      "account.move",
      [invoiceId],
      [
        "name",
        "move_type",
        "partner_id",
        "invoice_date",
        "invoice_date_due",
        "payment_reference",
        "currency_id",
        "invoice_line_ids",
        "state",
        "amount_untaxed",
        "amount_tax",
        "amount_total",
        "amount_residual",
        "payment_state",
        "journal_id",
        "company_id",
        "invoice_origin",
        "narration",
      ],
    );

    if (!rawInvoices[0]) return null;

    // Validate with Zod - no casting
    const invoice = odooInvoiceReadSchema.parse(rawInvoices[0]);

    return invoice;
  }

  /**
   * Create a new invoice (sales or purchase)
   */
  async createInvoice(dto: CreateInvoiceDTO): Promise<number> {
    const invoiceData: Partial<OdooInvoice> = {
      move_type: "out_invoice", // Default to sales invoice
      partner_id: dto.customerId,
      invoice_date: dto.invoiceDate,
      invoice_date_due: dto.dueDate,
      payment_reference: dto.reference,
      narration: dto.notes,
      invoice_line_ids: dto.lines.map((line) => [
        0,
        0,
        {
          name: line.description,
          quantity: line.quantity,
          price_unit: line.unitPrice,
          discount: line.discount,
          tax_ids: line.taxIds ? [[6, false, line.taxIds]] : undefined,
          product_id: line.productId,
          account_id: undefined, // Odoo will set default from product/partner
        } as OdooInvoiceLine,
      ]),
    };

    return this.client.create("account.move", invoiceData);
  }

  /**
   * Post (validate) an invoice
   */
  async postInvoice(invoiceId: number): Promise<void> {
    await this.client.executeKw("account.move", "action_post", [[invoiceId]]);
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: number): Promise<void> {
    await this.client.executeKw("account.move", "button_cancel", [[invoiceId]]);
  }

  /**
   * Draft an invoice (unpost)
   */
  async draftInvoice(invoiceId: number): Promise<void> {
    await this.client.executeKw("account.move", "button_draft", [[invoiceId]]);
  }

  // ==================== Payments ====================

  /**
   * Get payments with filters
   */
  async getPayments(filters?: {
    paymentType?: "inbound" | "outbound" | "transfer";
    partnerId?: number;
    state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooPayment[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (filters?.paymentType) {
      domain.push(["payment_type", "=", filters.paymentType]);
    }
    if (filters?.partnerId) {
      domain.push(["partner_id", "=", filters.partnerId]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }
    if (filters?.dateFrom) {
      domain.push(["date", ">=", filters.dateFrom]);
    }
    if (filters?.dateTo) {
      domain.push(["date", "<=", filters.dateTo]);
    }

    return this.client.searchRead<OdooPayment>(
      "account.payment",
      domain,
      [
        "name",
        "payment_type",
        "partner_type",
        "partner_id",
        "amount",
        "amount_signed",
        "amount_company_currency_signed",
        "currency_id",
        "company_currency_id",
        "date",
        "journal_id",
        "payment_method_line_id",
        "payment_method_id",
        "payment_method_code",
        "memo",
        "payment_reference",
        "state",
        "is_reconciled",
        "is_matched",
        "partner_bank_id",
        "destination_account_id",
        "outstanding_account_id",
        "move_id",
        "reconciled_invoice_ids",
        "reconciled_invoices_count",
        "qr_code",
      ],
      { order: "date desc" },
    );
  }

  /**
   * Create a payment
   */
  async createPayment(dto: CreatePaymentDTO): Promise<number> {
    const paymentData: Partial<OdooPayment> = {
      payment_type: dto.type,
      partner_type: dto.partnerType,
      partner_id: dto.partnerId,
      amount: dto.amount,
      date: dto.date,
      journal_id: dto.journalId,
      memo: dto.reference,
    };

    const paymentId = await this.client.create("account.payment", paymentData);

    // If invoice IDs provided, reconcile payment with invoices
    if (dto.invoiceIds && dto.invoiceIds.length > 0) {
      await this.reconcilePaymentWithInvoices(paymentId, dto.invoiceIds);
    }

    return paymentId;
  }

  /**
   * Post (confirm) a payment
   */
  async postPayment(paymentId: number): Promise<void> {
    await this.client.executeKw("account.payment", "action_post", [[paymentId]]);
  }

  /**
   * Reconcile payment with invoices
   */
  private async reconcilePaymentWithInvoices(
    paymentId: number,
    invoiceIds: number[],
  ): Promise<void> {
    // This is a simplified version - actual reconciliation in Odoo is complex
    // You may need to use account.move.line reconciliation methods
    await this.client.executeKw("account.payment", "action_post", [[paymentId]]);

    // Get payment move lines
    const payment = await this.client.read<OdooPayment>("account.payment", [paymentId], [
      "move_id",
    ]);

    if (!payment[0]?.destination_account_id) return;

    // Match payment lines with invoice lines for reconciliation
    // This would require more complex logic in a production system
  }

  // ==================== Partners (Customers/Suppliers) ====================

  /**
   * Get partners with accounting info
   */
  async getPartners(filters?: {
    isCustomer?: boolean;
    isSupplier?: boolean;
  }): Promise<OdooPartner[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (filters?.isCustomer) {
      domain.push(["customer_rank", ">", 0]);
    }
    if (filters?.isSupplier) {
      domain.push(["supplier_rank", ">", 0]);
    }

    return this.client.searchRead<OdooPartner>(
      "res.partner",
      domain,
      [
        "name",
        "display_name",
        "ref",
        "email",
        "phone",
        "mobile",
        "website",
        "vat",
        "company_registry",
        "street",
        "street2",
        "city",
        "state_id",
        "zip",
        "country_id",
        "country_code",
        "lang",
        "tz",
        "function",
        "is_company",
        "company_type",
        "parent_id",
        "user_id",
        "category_id",
        "comment",
        "active",
        "customer_rank",
        "supplier_rank",
        "property_account_receivable_id",
        "property_account_payable_id",
        "property_payment_term_id",
        "property_supplier_payment_term_id",
        "property_account_position_id",
        "trust",
        "invoice_sending_method",
        "currency_id",
        "bank_ids",
      ],
      { order: "name" },
    );
  }

  // ==================== Journals ====================

  /**
   * Get all journals
   */
  async getJournals(type?: "sale" | "purchase" | "cash" | "bank" | "general"): Promise<OdooJournal[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (type) {
      domain.push(["type", "=", type]);
    }

    return this.client.searchRead<OdooJournal>(
      "account.journal",
      domain,
      ["name", "code", "type", "currency_id", "company_id", "default_account_id"],
      { order: "name" },
    );
  }

  // ==================== Taxes ====================

  /**
   * Get all active taxes
   */
  async getTaxes(typeTaxUse?: "sale" | "purchase" | "none"): Promise<OdooTax[]> {
    const domain: Array<[string, string, unknown]> = [["active", "=", true]];

    if (typeTaxUse) {
      domain.push(["type_tax_use", "=", typeTaxUse]);
    }

    return this.client.searchRead<OdooTax>(
      "account.tax",
      domain,
      ["name", "amount", "amount_type", "type_tax_use", "active"],
      { order: "name" },
    );
  }

  // ==================== General Ledger ====================

  /**
   * Get general ledger entries
   */
  async getGLEntries(filters?: {
    accountId?: number;
    partnerId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooGLEntry[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (filters?.accountId) {
      domain.push(["account_id", "=", filters.accountId]);
    }
    if (filters?.partnerId) {
      domain.push(["partner_id", "=", filters.partnerId]);
    }
    if (filters?.dateFrom) {
      domain.push(["date", ">=", filters.dateFrom]);
    }
    if (filters?.dateTo) {
      domain.push(["date", "<=", filters.dateTo]);
    }

    return this.client.searchRead<OdooGLEntry>(
      "account.move.line",
      domain,
      [
        "move_id",
        "date",
        "account_id",
        "partner_id",
        "name",
        "debit",
        "credit",
        "balance",
        "amount_currency",
        "currency_id",
        "company_id",
      ],
      { order: "date desc, id desc" },
    );
  }

  // ==================== Financial Reports ====================

  /**
   * Get trial balance (account balances)
   */
  async getTrialBalance(query: AccountBalanceQuery): Promise<OdooAccountBalanceReport[]> {
    const glEntries = await this.getGLEntries({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    // Group by account and sum debits/credits
    const accountMap = new Map<number, OdooAccountBalanceReport>();

    for (const entry of glEntries) {
      const accountId = Array.isArray(entry.account_id) ? entry.account_id[0] : entry.account_id;
      const accountName = Array.isArray(entry.account_id) ? entry.account_id[1] : "";

      if (!accountMap.has(accountId)) {
        // Fetch account details
        const account = await this.getAccount(accountId);
        accountMap.set(accountId, {
          account_id: accountId,
          account_code: account?.code || "",
          account_name: account?.name || accountName,
          debit: 0,
          credit: 0,
          balance: 0,
        });
      }

      const report = accountMap.get(accountId)!;
      report.debit += entry.debit;
      report.credit += entry.credit;
      report.balance += entry.balance;
    }

    return Array.from(accountMap.values()).sort((a, b) => a.account_code.localeCompare(b.account_code));
  }

  /**
   * Get partner ledger (customer/supplier statement)
   */
  async getPartnerLedger(query: PartnerLedgerQuery): Promise<OdooPartnerLedgerReport | null> {
    const entries = await this.getGLEntries({
      partnerId: query.partnerId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    if (entries.length === 0) return null;

    // Get partner details
    const partners = await this.client.read<OdooPartner>("res.partner", [query.partnerId], ["name"]);
    const partnerName = partners[0]?.name || "Unknown";

    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = 0;

    const reportEntries = entries.map((entry) => {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
      runningBalance += entry.balance;

      return {
        date: entry.date,
        move_name: Array.isArray(entry.move_id) ? entry.move_id[1] : "",
        label: entry.name,
        debit: entry.debit,
        credit: entry.credit,
        balance: runningBalance,
      };
    });

    return {
      partner_id: query.partnerId,
      partner_name: partnerName,
      debit: totalDebit,
      credit: totalCredit,
      balance: runningBalance,
      entries: reportEntries,
    };
  }

  /**
   * Get profit & loss statement
   * Simplified version - Odoo has complex P&L report generation
   */
  async getProfitLoss(dateFrom?: string, dateTo?: string): Promise<{
    income: number;
    expenses: number;
    netProfit: number;
  }> {
    // Get all income accounts
    const incomeAccounts = await this.getAccounts({
      accountType: "income",
    });

    // Get all expense accounts
    const expenseAccounts = await this.getAccounts({
      accountType: "expense",
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    // Sum income
    for (const account of incomeAccounts) {
      const entries = await this.getGLEntries({
        accountId: account.id,
        dateFrom,
        dateTo,
      });
      totalIncome += entries.reduce((sum, entry) => sum + entry.credit - entry.debit, 0);
    }

    // Sum expenses
    for (const account of expenseAccounts) {
      const entries = await this.getGLEntries({
        accountId: account.id,
        dateFrom,
        dateTo,
      });
      totalExpenses += entries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
    }

    return {
      income: totalIncome,
      expenses: totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }
}
