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

export {
  odooInvoiceReadSchema,
  odooInvoiceLineReadSchema,
  odooPaymentReadSchema,
  odooPartnerReadSchema,
  odooJournalReadSchema,
  odooTaxReadSchema,
  odooGLEntryReadSchema,
  type OdooInvoiceRead,
  type OdooInvoiceLineRead,
};

export class OdooAccountingService {
  constructor(private readonly client: OdooClient) {}

  public getClient(): OdooClient {
    return this.client;
  }

  async getAccounts(filters?: { accountType?: string; onlyActive?: boolean }): Promise<OdooAccount[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.accountType) {
      domain.push(["account_type", "=", filters.accountType]);
    }
    if (filters?.onlyActive !== false) {
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

  async getAccount(accountId: number): Promise<OdooAccount | null> {
    const accounts = await this.client.read<OdooAccount>(
      "account.account",
      [accountId],
      [
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
      ],
    );
    return accounts[0] || null;
  }

  async searchAccounts(query: string): Promise<OdooAccount[]> {
    return this.client.searchRead<OdooAccount>(
      "account.account",
      ["&", ["active", "=", true], "|", ["code", "ilike", query], ["name", "ilike", query]],
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

  async getInvoices(filters?: {
    moveType?: "out_invoice" | "out_refund" | "in_invoice" | "in_refund";
    partnerId?: number;
    state?: "draft" | "posted" | "cancel";
    paymentState?: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooInvoiceRead[]> {
    const domain: (string | [string, string, unknown])[] = [];

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

    return this.client.searchRead<OdooInvoiceRead>(
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

    const invoice = odooInvoiceReadSchema.parse(rawInvoices[0]);

    return invoice;
  }

  async createInvoice(dto: CreateInvoiceDTO): Promise<number> {
    const moveType = dto.moveType ?? "out_invoice";
    const partnerId = dto.customerId ?? dto.supplierId;

    if (!partnerId) {
      throw new Error("Either customerId or supplierId is required");
    }

    const invoiceData: Partial<OdooInvoice> = {
      move_type: moveType,
      partner_id: partnerId,
      invoice_date: dto.invoiceDate,
      invoice_date_due: dto.dueDate,
      payment_reference: dto.reference,
      narration: dto.notes,
      invoice_payment_term_id: dto.paymentTermId,
      invoice_line_ids: dto.lines.map((line): [0, 0, OdooInvoiceLine] => {
        const lineData: OdooInvoiceLine = {
          name: line.description,
          quantity: line.quantity,
          price_unit: line.unitPrice,
          discount: line.discount,
          tax_ids: line.taxIds ? [[6, false, line.taxIds]] : undefined,
          product_id: line.productId,
          account_id: undefined, // Odoo will set default from product/partner
        };
        return [0, 0, lineData];
      }),
    };

    return this.client.create("account.move", invoiceData);
  }

  async createRefund(
    invoiceId: number,
    dto: { reason?: string; date?: string; journalId?: number },
  ): Promise<number> {
    const result = await this.client.executeKw<{ res_id: number }>(
      "account.move",
      "action_reverse",
      [[invoiceId]],
      {
        date: dto.date,
        reason: dto.reason,
        journal_id: dto.journalId,
      },
    );
    return result.res_id;
  }

  async getInvoicePDF(invoiceId: number, templateId = "account.report_invoice"): Promise<Buffer> {
    const _result = await this.client.executeKw<string>("account.move", "action_invoice_print", [
      [invoiceId],
    ]);

    // The result is typically a report action, we need to get the PDF content
    // This uses Odoo's report system with the specified template
    const pdfBase64 = await this.client.executeKw<string>("ir.actions.report", "_render_qweb_pdf", [
      templateId,
      [invoiceId],
    ]);

    return Buffer.from(pdfBase64, "base64");
  }

  async getAvailableReportTemplates(model?: string): Promise<
    {
      id: number;
      name: string;
      report_name: string;
      model: string;
      report_type: string;
    }[]
  > {
    const domain: [string, string, unknown][] = [["report_type", "=", "qweb-pdf"]];

    if (model) {
      domain.push(["model", "=", model]);
    }

    return this.client.searchRead("ir.actions.report", domain, [
      "name",
      "report_name",
      "model",
      "report_type",
    ]);
  }

  async postInvoice(invoiceId: number): Promise<void> {
    await this.client.executeKw("account.move", "action_post", [[invoiceId]]);
  }

  async cancelInvoice(invoiceId: number): Promise<void> {
    await this.client.executeKw("account.move", "button_cancel", [[invoiceId]]);
  }

  async draftInvoice(invoiceId: number): Promise<void> {
    await this.client.executeKw("account.move", "button_draft", [[invoiceId]]);
  }

  async getPayments(filters?: {
    paymentType?: "inbound" | "outbound" | "transfer";
    partnerId?: number;
    state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooPayment[]> {
    const domain: [string, string, unknown][] = [];

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

    if (dto.invoiceIds && dto.invoiceIds.length > 0) {
      await this.reconcilePaymentWithInvoices(paymentId, dto.invoiceIds);
    }

    return paymentId;
  }

  async postPayment(paymentId: number): Promise<void> {
    await this.client.executeKw("account.payment", "action_post", [[paymentId]]);
  }

  private async reconcilePaymentWithInvoices(paymentId: number, invoiceIds: number[]): Promise<void> {
    await this.client.executeKw("account.payment", "action_post", [[paymentId]]);

    const payment = await this.client.read<OdooPayment>(
      "account.payment",
      [paymentId],
      ["move_id", "destination_account_id"],
    );

    if (!payment[0]?.move_id || !payment[0]?.destination_account_id) {
      throw new Error("Payment does not have a move or destination account");
    }

    const paymentMoveId = Array.isArray(payment[0].move_id) ? payment[0].move_id[0] : payment[0].move_id;
    const destinationAccountId = Array.isArray(payment[0].destination_account_id)
      ? payment[0].destination_account_id[0]
      : payment[0].destination_account_id;

    const paymentLines = await this.client.searchRead<{ id: number; account_id: [number, string] }>(
      "account.move.line",
      [
        ["move_id", "=", paymentMoveId],
        ["account_id", "=", destinationAccountId],
      ],
      ["id", "account_id"],
    );

    if (paymentLines.length === 0) {
      throw new Error("No payment lines found for reconciliation");
    }

    const invoiceLines = await this.client.searchRead<{ id: number; move_id: [number, string] }>(
      "account.move.line",
      [
        ["move_id", "in", invoiceIds],
        ["account_id", "=", destinationAccountId],
        ["reconciled", "=", false],
      ],
      ["id", "move_id"],
    );

    if (invoiceLines.length === 0) {
      throw new Error("No unreconciled invoice lines found for reconciliation");
    }

    const lineIdsToReconcile = [
      ...paymentLines.map((line) => line.id),
      ...invoiceLines.map((line) => line.id),
    ];

    await this.client.executeKw("account.move.line", "reconcile", [lineIdsToReconcile]);
  }

  async getPartners(filters?: { isCustomer?: boolean; isSupplier?: boolean }): Promise<OdooPartner[]> {
    const domain: [string, string, unknown][] = [];

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

  async getJournals(type?: "sale" | "purchase" | "cash" | "bank" | "general"): Promise<OdooJournal[]> {
    const domain: [string, string, unknown][] = [];

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

  async getTaxes(typeTaxUse?: "sale" | "purchase" | "none"): Promise<OdooTax[]> {
    const domain: [string, string, unknown][] = [["active", "=", true]];

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

  async getGLEntries(filters?: {
    accountId?: number;
    partnerId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooGLEntry[]> {
    const domain: [string, string, unknown][] = [];

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

  async getTrialBalance(query: AccountBalanceQuery): Promise<OdooAccountBalanceReport[]> {
    const glEntries = await this.getGLEntries({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    const accountMap = new Map<number, OdooAccountBalanceReport>();

    for (const entry of glEntries) {
      const accountId = Array.isArray(entry.account_id) ? entry.account_id[0] : entry.account_id;
      const accountName = Array.isArray(entry.account_id) ? entry.account_id[1] : "";

      if (!accountMap.has(accountId)) {
        const account = await this.getAccount(accountId);
        accountMap.set(accountId, {
          account_id: accountId,
          account_code: account?.code ?? "",
          account_name: account?.name ?? accountName,
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

  async getPartnerLedger(query: PartnerLedgerQuery): Promise<OdooPartnerLedgerReport | null> {
    const entries = await this.getGLEntries({
      partnerId: query.partnerId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    if (entries.length === 0) return null;

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

  async getProfitLoss(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    income: number;
    expenses: number;
    netProfit: number;
  }> {
    const incomeAccounts = await this.getAccounts({
      accountType: "income",
    });

    const expenseAccounts = await this.getAccounts({
      accountType: "expense",
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const account of incomeAccounts) {
      const entries = await this.getGLEntries({
        accountId: account.id,
        dateFrom,
        dateTo,
      });
      totalIncome += entries.reduce((sum, entry) => sum + entry.credit - entry.debit, 0);
    }

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

  async getPaymentTerms(): Promise<
    {
      id: number;
      name: string;
      note?: string;
    }[]
  > {
    const results = await this.client.searchRead<{ id: number; name: string; note?: string }>(
      "account.payment.term",
      [["active", "=", true]],
      ["name", "note"],
      { order: "name" },
    );
    return results;
  }

  async getPaymentTerm(paymentTermId: number): Promise<{
    id: number;
    name: string;
    note?: string;
  } | null> {
    const results = await this.client.read<{ id: number; name: string; note?: string }>(
      "account.payment.term",
      [paymentTermId],
      ["name", "note"],
    );
    return results[0] || null;
  }

  async getAgedReceivables(asOfDate?: string): Promise<
    {
      partnerId: number;
      partnerName: string;
      current: number; // Not yet due
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      days_over_90: number;
      total: number;
    }[]
  > {
    const today = asOfDate ?? new Date().toISOString().split("T")[0];

    const invoices = await this.getInvoices({
      moveType: "out_invoice",
      state: "posted",
      paymentState: "not_paid",
    });

    const partnerMap = new Map<
      number,
      {
        partnerId: number;
        partnerName: string;
        current: number;
        days_1_30: number;
        days_31_60: number;
        days_61_90: number;
        days_over_90: number;
        total: number;
      }
    >();

    for (const invoice of invoices) {
      let partnerId: number;
      let partnerName: string;

      if (Array.isArray(invoice.partner_id)) {
        partnerId = invoice.partner_id[0];
        partnerName = invoice.partner_id[1];
      } else if (typeof invoice.partner_id === "number") {
        partnerId = invoice.partner_id;
        //TODO: get partner name
        partnerName = "";
      } else {
        continue;
      }

      const dueDate = invoice.invoice_date_due ?? invoice.invoice_date ?? today;
      const amount = invoice.amount_residual ?? 0;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName,
          current: 0,
          days_1_30: 0,
          days_31_60: 0,
          days_61_90: 0,
          days_over_90: 0,
          total: 0,
        });
      }

      const partner = partnerMap.get(partnerId)!;
      const daysPastDue = Math.floor(
        (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysPastDue <= 0) {
        partner.current += amount;
      } else if (daysPastDue <= 30) {
        partner.days_1_30 += amount;
      } else if (daysPastDue <= 60) {
        partner.days_31_60 += amount;
      } else if (daysPastDue <= 90) {
        partner.days_61_90 += amount;
      } else {
        partner.days_over_90 += amount;
      }

      partner.total += amount;
    }

    return Array.from(partnerMap.values()).sort((a, b) => b.total - a.total);
  }

  async getAgedPayables(asOfDate?: string): Promise<
    {
      partnerId: number;
      partnerName: string;
      current: number; // Not yet due
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      days_over_90: number;
      total: number;
    }[]
  > {
    const today = asOfDate ?? new Date().toISOString().split("T")[0];

    const bills = await this.getInvoices({
      moveType: "in_invoice",
      state: "posted",
      paymentState: "not_paid",
    });

    const partnerMap = new Map<
      number,
      {
        partnerId: number;
        partnerName: string;
        current: number;
        days_1_30: number;
        days_31_60: number;
        days_61_90: number;
        days_over_90: number;
        total: number;
      }
    >();

    for (const bill of bills) {
      let partnerId: number;
      let partnerName: string;

      if (Array.isArray(bill.partner_id)) {
        partnerId = bill.partner_id[0];
        partnerName = bill.partner_id[1];
      } else if (typeof bill.partner_id === "number") {
        partnerId = bill.partner_id;
        partnerName = "";
      } else {
        // Skip bills without a valid partner (null or false)
        continue;
      }

      const dueDate = bill.invoice_date_due ?? bill.invoice_date ?? today;
      const amount = bill.amount_residual ?? 0;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName,
          current: 0,
          days_1_30: 0,
          days_31_60: 0,
          days_61_90: 0,
          days_over_90: 0,
          total: 0,
        });
      }

      const partner = partnerMap.get(partnerId)!;
      const daysPastDue = Math.floor(
        (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysPastDue <= 0) {
        partner.current += amount;
      } else if (daysPastDue <= 30) {
        partner.days_1_30 += amount;
      } else if (daysPastDue <= 60) {
        partner.days_31_60 += amount;
      } else if (daysPastDue <= 90) {
        partner.days_61_90 += amount;
      } else {
        partner.days_over_90 += amount;
      }

      partner.total += amount;
    }

    return Array.from(partnerMap.values()).sort((a, b) => b.total - a.total);
  }

  async getBankStatements(filters?: {
    journalId?: number;
    dateFrom?: string;
    dateTo?: string;
    state?: "open" | "confirm";
  }): Promise<
    {
      id: number;
      name: string;
      journalId: number;
      journalName: string;
      date: string;
      balanceStart: number;
      balanceEndReal: number;
      balanceEnd: number;
      state: string;
    }[]
  > {
    const domain: [string, string, unknown][] = [];

    if (filters?.journalId) {
      domain.push(["journal_id", "=", filters.journalId]);
    }
    if (filters?.dateFrom) {
      domain.push(["date", ">=", filters.dateFrom]);
    }
    if (filters?.dateTo) {
      domain.push(["date", "<=", filters.dateTo]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }

    const results = await this.client.searchRead<{
      id: number;
      name: string;
      journal_id: [number, string];
      date: string;
      balance_start: number;
      balance_end_real: number;
      balance_end: number;
      state: string;
    }>("account.bank.statement", domain, [
      "name",
      "journal_id",
      "date",
      "balance_start",
      "balance_end_real",
      "balance_end",
      "state",
    ]);

    return results.map((stmt) => ({
      id: stmt.id,
      name: stmt.name,
      journalId: stmt.journal_id[0],
      journalName: stmt.journal_id[1],
      date: stmt.date,
      balanceStart: stmt.balance_start,
      balanceEndReal: stmt.balance_end_real,
      balanceEnd: stmt.balance_end,
      state: stmt.state,
    }));
  }

  async getBankStatementLines(statementId: number): Promise<
    {
      id: number;
      date: string;
      paymentRef: string;
      partnerName?: string;
      amount: number;
      isReconciled: boolean;
    }[]
  > {
    const results = await this.client.searchRead<{
      id: number;
      date: string;
      payment_ref: string;
      partner_name?: string;
      amount: number;
      is_reconciled: boolean;
    }>(
      "account.bank.statement.line",
      [["statement_id", "=", statementId]],
      ["date", "payment_ref", "partner_name", "amount", "is_reconciled"],
    );

    return results.map((line) => ({
      id: line.id,
      date: line.date,
      paymentRef: line.payment_ref,
      partnerName: line.partner_name,
      amount: line.amount,
      isReconciled: line.is_reconciled,
    }));
  }

  async getReconciliationSuggestions(lineId: number): Promise<
    {
      moveId: number;
      moveName: string;
      partnerName: string;
      date: string;
      amount: number;
    }[]
  > {
    const suggestions = await this.client.executeKw<
      {
        id: number;
        name: string;
        partner_name: string;
        date: string;
        amount_residual: number;
      }[]
    >("account.bank.statement.line", "get_reconciliation_proposition", [[lineId]]);

    return suggestions.map((sugg) => ({
      moveId: sugg.id,
      moveName: sugg.name,
      partnerName: sugg.partner_name,
      date: sugg.date,
      amount: sugg.amount_residual,
    }));
  }

  async reconcileBankStatementLine(
    lineId: number,
    moveIds: number[],
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await this.client.executeKw("account.bank.statement.line", "reconcile", [
        [lineId],
        {
          counterpart_aml_dicts: moveIds.map((moveId) => ({ counterpart_aml_id: moveId })),
        },
      ]);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Reconciliation failed",
      };
    }
  }

  async getCurrencies(onlyActive = true): Promise<
    {
      id: number;
      name: string;
      symbol: string;
      position: "after" | "before";
      rounding: number;
      active: boolean;
    }[]
  > {
    const domain: [string, string, unknown][] = [];
    if (onlyActive) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<{
      id: number;
      name: string;
      symbol: string;
      position: "after" | "before";
      rounding: number;
      active: boolean;
    }>("res.currency", domain, ["name", "symbol", "position", "rounding", "active"]);
  }

  async getCurrencyRates(
    currencyId?: number,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<
    {
      id: number;
      currencyId: number;
      currencyName: string;
      name: string; // Date
      rate: number;
      companyId: number;
    }[]
  > {
    const domain: [string, string, unknown][] = [];

    if (currencyId) {
      domain.push(["currency_id", "=", currencyId]);
    }
    if (dateFrom) {
      domain.push(["name", ">=", dateFrom]);
    }
    if (dateTo) {
      domain.push(["name", "<=", dateTo]);
    }

    const results = await this.client.searchRead<{
      id: number;
      currency_id: [number, string];
      name: string;
      rate: number;
      company_id: [number, string];
    }>("res.currency.rate", domain, ["currency_id", "name", "rate", "company_id"], { order: "name desc" });

    return results.map((rate) => ({
      id: rate.id,
      currencyId: rate.currency_id[0],
      currencyName: rate.currency_id[1],
      name: rate.name,
      rate: rate.rate,
      companyId: rate.company_id[0],
    }));
  }

  async convertCurrency(
    amount: number,
    fromCurrencyId: number,
    toCurrencyId: number,
    date?: string,
  ): Promise<{ convertedAmount: number; rate: number }> {
    const result = await this.client.executeKw<{ amount: number; rate: number }>("res.currency", "_convert", [
      amount,
      fromCurrencyId,
      toCurrencyId,
      date ?? new Date().toISOString().split("T")[0],
    ]);

    return {
      convertedAmount: result.amount,
      rate: result.rate,
    };
  }

  async batchValidateInvoices(invoiceIds: number[]): Promise<{
    success: number[];
    failed: { id: number; error: string }[];
  }> {
    const success: number[] = [];
    const failed: { id: number; error: string }[] = [];

    for (const invoiceId of invoiceIds) {
      try {
        await this.postInvoice(invoiceId);
        success.push(invoiceId);
      } catch (err) {
        failed.push({
          id: invoiceId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { success, failed };
  }

  async batchCancelInvoices(invoiceIds: number[]): Promise<{
    success: number[];
    failed: { id: number; error: string }[];
  }> {
    const success: number[] = [];
    const failed: { id: number; error: string }[] = [];

    for (const invoiceId of invoiceIds) {
      try {
        await this.cancelInvoice(invoiceId);
        success.push(invoiceId);
      } catch (err) {
        failed.push({
          id: invoiceId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { success, failed };
  }

  async batchCreateInvoices(invoices: CreateInvoiceDTO[]): Promise<{
    success: { index: number; id: number }[];
    failed: { index: number; error: string }[];
  }> {
    const success: { index: number; id: number }[] = [];
    const failed: { index: number; error: string }[] = [];

    for (let i = 0; i < invoices.length; i++) {
      try {
        const invoiceId = await this.createInvoice(invoices[i]);
        success.push({ index: i, id: invoiceId });
      } catch (err) {
        failed.push({
          index: i,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { success, failed };
  }

  async batchCreatePayments(payments: CreatePaymentDTO[]): Promise<{
    success: { index: number; id: number }[];
    failed: { index: number; error: string }[];
  }> {
    const success: { index: number; id: number }[] = [];
    const failed: { index: number; error: string }[] = [];

    for (let i = 0; i < payments.length; i++) {
      try {
        const paymentId = await this.createPayment(payments[i]);
        success.push({ index: i, id: paymentId });
      } catch (err) {
        failed.push({
          index: i,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { success, failed };
  }

  async batchConfirmPayments(paymentIds: number[]): Promise<{
    success: number[];
    failed: { id: number; error: string }[];
  }> {
    const success: number[] = [];
    const failed: { id: number; error: string }[] = [];

    for (const paymentId of paymentIds) {
      try {
        await this.postPayment(paymentId);
        success.push(paymentId);
      } catch (err) {
        failed.push({
          id: paymentId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { success, failed };
  }
}
