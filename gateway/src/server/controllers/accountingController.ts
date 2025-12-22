import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Security,
  NoSecurity,
  Query,
  Body,
  Path,
  SuccessResponse,
  OperationId,
  Request,
} from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";
import { odoo } from "@safee/database";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type {
  CreatePaymentDTO,
  AccountBalanceQuery,
  PartnerLedgerQuery,
} from "../dtos/accounting.js";
import type {
  PaymentResponse,
  PartnerResponse,
  JournalResponse,
  TaxResponse,
  GLEntryResponse,
  AccountBalanceReportResponse,
  PartnerLedgerReportResponse,
  ProfitLossResponse,
} from "../types/hisabiq.js";
import { DocumentTemplateService } from "../services/documentTemplate.service.js";
import { getServerContext } from "../serverContext.js";

@Route("accounting")
@Tags("Accounting")
export class AccountingController extends Controller {
  @NoSecurity()
  private async getAccountingService(request: AuthenticatedRequest): Promise<odoo.OdooAccountingService> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);
    return new odoo.OdooAccountingService(client);
  }

  @Get("invoices")
  @Security("jwt")
  @OperationId("GetAccountingInvoices")
  public async getInvoices(
    @Request() request: AuthenticatedRequest,
    @Query() page = 1,
    @Query() limit = 20,
    @Query() type?: "SALES" | "PURCHASE",
    @Query() state?: "draft" | "posted" | "cancel",
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    const service = await this.getAccountingService(request);

    let moveType: "out_invoice" | "in_invoice" | undefined;
    if (type === "SALES") moveType = "out_invoice";
    if (type === "PURCHASE") moveType = "in_invoice";

    const odooInvoices = await service.getInvoices({
      moveType,
      state,
      dateFrom,
      dateTo,
    });

    const invoices: Invoice[] = odooInvoices.map((inv) => ({
      id: inv.id ? inv.id.toString() : "",
      number: inv.name ?? "Draft",
      type: inv.move_type === "out_invoice" ? "SALES" : "PURCHASE",
      date: inv.invoice_date ?? "",
      total: inv.amount_total ?? 0,
      status: inv.state ?? "draft",
    }));

    return {
      invoices,
      total: invoices.length,
      page,
      limit,
    };
  }

  @Get("invoices/{invoiceId}")
  @Security("jwt")
  @OperationId("GetAccountingInvoice")
  public async getInvoice(
    @Request() request: AuthenticatedRequest,
    @Path() invoiceId: string,
  ): Promise<Invoice> {
    const service = await this.getAccountingService(request);
    const invoice = await service.getInvoice(Number.parseInt(invoiceId));

    if (!invoice) {
      this.setStatus(404);
      throw new Error("Invoice not found");
    }

    return {
      id: invoice.id ? invoice.id.toString() : "",
      number: invoice.name ?? "Draft",
      type: invoice.move_type === "out_invoice" ? "SALES" : "PURCHASE",
      date: invoice.invoice_date ?? "",
      total: invoice.amount_total ?? 0,
      status: invoice.state ?? "draft",
    };
  }

  @Post("invoices")
  @Security("jwt")
  @SuccessResponse("201", "Invoice created successfully")
  @OperationId("CreateAccountingInvoice")
  public async createInvoice(
    @Request() request: AuthenticatedRequest,
    @Body() invoiceRequest: InvoiceCreateRequest,
  ): Promise<Invoice> {
    const service = await this.getAccountingService(request);

    const customerId =
      invoiceRequest.type === "SALES"
        ? Number.parseInt(invoiceRequest.customerId ?? "0")
        : Number.parseInt(invoiceRequest.supplierId ?? "0");

    const invoiceId = await service.createInvoice({
      customerId,
      invoiceDate: invoiceRequest.date,
      dueDate: invoiceRequest.dueDate,
      lines: invoiceRequest.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    const odooInvoice = await service.getInvoice(invoiceId);

    if (!odooInvoice) {
      this.setStatus(500);
      throw new Error("Failed to fetch created invoice");
    }

    this.setStatus(201);
    return {
      id: odooInvoice.id ? odooInvoice.id.toString() : "",
      number: odooInvoice.name ?? "Draft",
      type: invoiceRequest.type,
      date: odooInvoice.invoice_date ?? invoiceRequest.date,
      total: odooInvoice.amount_total ?? 0,
      status: odooInvoice.state ?? "draft",
    };
  }

  @Post("invoices/{invoiceId}/validate")
  @Security("jwt")
  @OperationId("ValidateAccountingInvoice")
  public async validateInvoice(
    @Request() request: AuthenticatedRequest,
    @Path() invoiceId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.getAccountingService(request);
    await service.postInvoice(Number.parseInt(invoiceId));
    return { success: true };
  }

  @Post("invoices/{invoiceId}/cancel")
  @Security("jwt")
  @OperationId("CancelAccountingInvoice")
  public async cancelInvoice(
    @Request() request: AuthenticatedRequest,
    @Path() invoiceId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.getAccountingService(request);
    await service.cancelInvoice(Number.parseInt(invoiceId));
    return { success: true };
  }

  @Post("invoices/{invoiceId}/refund")
  @Security("jwt")
  @OperationId("RefundAccountingInvoice")
  public async refundInvoice(
    @Request() request: AuthenticatedRequest,
    @Path() invoiceId: string,
    @Body() refundRequest: { reason?: string; date?: string; journalId?: number },
  ): Promise<{ refundId: number }> {
    const service = await this.getAccountingService(request);
    const refundId = await service.createRefund(Number.parseInt(invoiceId), refundRequest);
    return { refundId };
  }

  @Get("invoices/{invoiceId}/pdf")
  @Security("jwt")
  @OperationId("GetAccountingInvoicePDF")
  public async getInvoicePDF(
    @Request() request: AuthenticatedRequest,
    @Path() invoiceId: string,
  ): Promise<Buffer> {
    const service = await this.getAccountingService(request);
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    // Get the organization's template preference
    const ctx = getServerContext();
    const docTemplateService = new DocumentTemplateService(ctx);
    const templateId = await docTemplateService.getActiveTemplate(organizationId, "invoice");

    this.setHeader("Content-Type", "application/pdf");
    this.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceId}.pdf"`);
    return service.getInvoicePDF(Number.parseInt(invoiceId), templateId);
  }

  // ==================== Vendor Bills ====================

  @Get("bills")
  @Security("jwt")
  @OperationId("GetAccountingBills")
  public async getBills(
    @Request() request: AuthenticatedRequest,
    @Query() page = 1,
    @Query() limit = 20,
    @Query() state?: "draft" | "posted" | "cancel",
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<{
    bills: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    const service = await this.getAccountingService(request);

    const odooBills = await service.getInvoices({
      moveType: "in_invoice",
      state,
      dateFrom,
      dateTo,
    });

    const bills: Invoice[] = odooBills.map((bill) => ({
      id: bill.id ? bill.id.toString() : "",
      number: bill.name ?? "Draft",
      type: "PURCHASE",
      date: bill.invoice_date ?? "",
      total: bill.amount_total ?? 0,
      status: bill.state ?? "draft",
    }));

    return {
      bills,
      total: bills.length,
      page,
      limit,
    };
  }

  @Get("bills/{billId}")
  @Security("jwt")
  @OperationId("GetAccountingBill")
  public async getBill(@Request() request: AuthenticatedRequest, @Path() billId: string): Promise<Invoice> {
    const service = await this.getAccountingService(request);
    const bill = await service.getInvoice(Number.parseInt(billId));

    if (!bill) {
      this.setStatus(404);
      throw new Error("Bill not found");
    }

    return {
      id: bill.id ? bill.id.toString() : "",
      number: bill.name ?? "Draft",
      type: "PURCHASE",
      date: bill.invoice_date ?? "",
      total: bill.amount_total ?? 0,
      status: bill.state ?? "draft",
    };
  }

  @Post("bills")
  @Security("jwt")
  @SuccessResponse("201", "Bill created successfully")
  @OperationId("CreateAccountingBill")
  public async createBill(
    @Request() request: AuthenticatedRequest,
    @Body() billRequest: InvoiceCreateRequest,
  ): Promise<Invoice> {
    const service = await this.getAccountingService(request);

    const supplierId = Number.parseInt(billRequest.supplierId ?? "0");

    const billId = await service.createInvoice({
      moveType: "in_invoice",
      supplierId,
      invoiceDate: billRequest.date,
      dueDate: billRequest.dueDate,
      lines: billRequest.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    const odooBill = await service.getInvoice(billId);

    if (!odooBill) {
      this.setStatus(500);
      throw new Error("Failed to fetch created bill");
    }

    this.setStatus(201);
    return {
      id: odooBill.id ? odooBill.id.toString() : "",
      number: odooBill.name ?? "Draft",
      type: "PURCHASE",
      date: odooBill.invoice_date ?? billRequest.date,
      total: odooBill.amount_total ?? 0,
      status: odooBill.state ?? "draft",
    };
  }

  @Post("bills/{billId}/validate")
  @Security("jwt")
  @OperationId("ValidateAccountingBill")
  public async validateBill(
    @Request() request: AuthenticatedRequest,
    @Path() billId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.getAccountingService(request);
    await service.postInvoice(Number.parseInt(billId));
    return { success: true };
  }

  @Post("bills/{billId}/cancel")
  @Security("jwt")
  @OperationId("CancelAccountingBill")
  public async cancelBill(
    @Request() request: AuthenticatedRequest,
    @Path() billId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.getAccountingService(request);
    await service.cancelInvoice(Number.parseInt(billId));
    return { success: true };
  }

  @Post("bills/{billId}/refund")
  @Security("jwt")
  @OperationId("RefundAccountingBill")
  public async refundBill(
    @Request() request: AuthenticatedRequest,
    @Path() billId: string,
    @Body() refundRequest: { reason?: string; date?: string; journalId?: number },
  ): Promise<{ refundId: number }> {
    const service = await this.getAccountingService(request);
    const refundId = await service.createRefund(Number.parseInt(billId), refundRequest);
    return { refundId };
  }

  @Get("bills/{billId}/pdf")
  @Security("jwt")
  @OperationId("GetAccountingBillPDF")
  public async getBillPDF(@Request() request: AuthenticatedRequest, @Path() billId: string): Promise<Buffer> {
    const service = await this.getAccountingService(request);
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    // Get the organization's template preference
    const ctx = getServerContext();
    const docTemplateService = new DocumentTemplateService(ctx);
    const templateId = await docTemplateService.getActiveTemplate(organizationId, "bill");

    this.setHeader("Content-Type", "application/pdf");
    this.setHeader("Content-Disposition", `attachment; filename="bill-${billId}.pdf"`);
    return service.getInvoicePDF(Number.parseInt(billId), templateId);
  }

  @Get("accounts")
  @Security("jwt")
  @OperationId("GetAccountingAccounts")
  public async getAccounts(
    @Request() request: AuthenticatedRequest,
    @Query() accountType?: string,
  ): Promise<
    {
      id: string;
      code: string;
      name: string;
      type: string;
      parentId?: string;
    }[]
  > {
    const service = await this.getAccountingService(request);
    const accounts = await service.getAccounts({
      accountType,
    });

    return accounts.map((acc) => ({
      id: acc.id.toString(),
      code: acc.code,
      name: acc.name,
      type: acc.account_type,
      parentId: acc.group_id ? acc.group_id[0].toString() : undefined,
    }));
  }

  @Get("accounts/search")
  @Security("jwt")
  @OperationId("SearchAccountingAccounts")
  public async searchAccounts(
    @Request() request: AuthenticatedRequest,
    @Query() q: string,
  ): Promise<
    {
      id: string;
      code: string;
      name: string;
      type: string;
    }[]
  > {
    const service = await this.getAccountingService(request);
    const accounts = await service.searchAccounts(q);

    return accounts.map((acc) => ({
      id: acc.id.toString(),
      code: acc.code,
      name: acc.name,
      type: acc.account_type,
    }));
  }

  @Get("payments")
  @Security("jwt")
  @OperationId("GetAccountingPayments")
  public async getPayments(
    @Request() request: AuthenticatedRequest,
    @Query() type?: "inbound" | "outbound" | "transfer",
    @Query() state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled",
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<PaymentResponse[]> {
    const service = await this.getAccountingService(request);
    const payments = await service.getPayments({
      paymentType: type,
      state,
      dateFrom,
      dateTo,
    });

    // Map Odoo tuples to camelCase objects
    return payments.map((p) => ({
      id: p.id,
      paymentType: p.payment_type,
      partnerType: p.partner_type,
      partnerId: Array.isArray(p.partner_id) ? p.partner_id[0] : p.partner_id,
      amount: p.amount,
      currencyId: Array.isArray(p.currency_id) ? p.currency_id[0] : p.currency_id,
      paymentDate: p.date,
      journalId: Array.isArray(p.journal_id) ? p.journal_id[0] : p.journal_id,
      paymentMethodId: Array.isArray(p.payment_method_id) ? p.payment_method_id[0] : p.payment_method_id,
      ref: p.memo,
      state: p.state,
    }));
  }

  @Post("payments")
  @Security("jwt")
  @SuccessResponse("201", "Payment created successfully")
  @OperationId("CreateAccountingPayment")
  public async createPayment(
    @Request() request: AuthenticatedRequest,
    @Body() paymentRequest: CreatePaymentDTO,
  ): Promise<{ id: number }> {
    const service = await this.getAccountingService(request);
    const paymentId = await service.createPayment(paymentRequest);

    this.setStatus(201);
    return { id: paymentId };
  }

  @Post("payments/{paymentId}/confirm")
  @Security("jwt")
  @OperationId("ConfirmAccountingPayment")
  public async confirmPayment(
    @Request() request: AuthenticatedRequest,
    @Path() paymentId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.getAccountingService(request);
    await service.postPayment(Number.parseInt(paymentId));
    return { success: true };
  }

  @Get("partners")
  @Security("jwt")
  @OperationId("GetAccountingPartners")
  public async getPartners(
    @Request() request: AuthenticatedRequest,
    @Query() isCustomer?: boolean,
    @Query() isSupplier?: boolean,
  ): Promise<PartnerResponse[]> {
    const service = await this.getAccountingService(request);
    const partners = await service.getPartners({
      isCustomer,
      isSupplier,
    });

    // Map Odoo tuples to camelCase objects
    return partners.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      vat: p.vat,
      accountReceivableId: Array.isArray(p.property_account_receivable_id)
        ? p.property_account_receivable_id[0]
        : p.property_account_receivable_id,
      accountPayableId: Array.isArray(p.property_account_payable_id)
        ? p.property_account_payable_id[0]
        : p.property_account_payable_id,
      paymentTermId: Array.isArray(p.property_payment_term_id)
        ? p.property_payment_term_id[0]
        : p.property_payment_term_id,
      customerRank: p.customer_rank,
      supplierRank: p.supplier_rank,
    }));
  }

  @Get("journals")
  @Security("jwt")
  @OperationId("GetAccountingJournals")
  public async getJournals(
    @Request() request: AuthenticatedRequest,
    @Query() type?: "sale" | "purchase" | "cash" | "bank" | "general",
  ): Promise<JournalResponse[]> {
    const service = await this.getAccountingService(request);
    const journals = await service.getJournals(type);

    // Map Odoo tuples to camelCase objects
    return journals.map((j) => ({
      id: j.id,
      name: j.name,
      code: j.code,
      type: j.type,
      currencyId: Array.isArray(j.currency_id) ? j.currency_id[0] : j.currency_id,
      currencyName: Array.isArray(j.currency_id) ? j.currency_id[1] : undefined,
      companyId: Array.isArray(j.company_id) ? j.company_id[0] : j.company_id,
      companyName: Array.isArray(j.company_id) ? j.company_id[1] : undefined,
      defaultAccountId: Array.isArray(j.default_account_id) ? j.default_account_id[0] : j.default_account_id,
      defaultAccountName: Array.isArray(j.default_account_id) ? j.default_account_id[1] : undefined,
    }));
  }

  @Get("taxes")
  @Security("jwt")
  @OperationId("GetAccountingTaxes")
  public async getTaxes(
    @Request() request: AuthenticatedRequest,
    @Query() typeTaxUse?: "sale" | "purchase" | "none",
  ): Promise<TaxResponse[]> {
    const service = await this.getAccountingService(request);
    const taxes = await service.getTaxes(typeTaxUse);

    // Map to camelCase
    return taxes.map((t) => ({
      id: t.id,
      name: t.name,
      amount: t.amount,
      amountType: t.amount_type,
      typeTaxUse: t.type_tax_use,
      active: t.active,
    }));
  }

  @Post("reports/trial-balance")
  @Security("jwt")
  @OperationId("GetAccountingTrialBalance")
  public async getTrialBalance(
    @Request() request: AuthenticatedRequest,
    @Body() query: AccountBalanceQuery,
  ): Promise<AccountBalanceReportResponse[]> {
    const service = await this.getAccountingService(request);
    const report = await service.getTrialBalance(query);

    // Map to camelCase
    return report.map((item) => ({
      accountId: item.account_id,
      accountCode: item.account_code,
      accountName: item.account_name,
      debit: item.debit,
      credit: item.credit,
      balance: item.balance,
    }));
  }

  @Post("reports/partner-ledger")
  @Security("jwt")
  @OperationId("GetAccountingPartnerLedger")
  public async getPartnerLedger(
    @Request() request: AuthenticatedRequest,
    @Body() query: PartnerLedgerQuery,
  ): Promise<PartnerLedgerReportResponse | null> {
    const service = await this.getAccountingService(request);
    const report = await service.getPartnerLedger(query);

    if (!report) return null;

    // Map to camelCase
    return {
      partnerId: report.partner_id,
      partnerName: report.partner_name,
      debit: report.debit,
      credit: report.credit,
      balance: report.balance,
      entries: report.entries.map((entry) => ({
        date: entry.date,
        moveName: entry.move_name,
        label: entry.label,
        debit: entry.debit,
        credit: entry.credit,
        balance: entry.balance,
      })),
    };
  }

  @Get("reports/profit-loss")
  @Security("jwt")
  @OperationId("GetAccountingProfitLoss")
  public async getProfitLoss(
    @Request() request: AuthenticatedRequest,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<ProfitLossResponse> {
    const service = await this.getAccountingService(request);
    return service.getProfitLoss(dateFrom, dateTo);
  }

  @Get("general-ledger")
  @Security("jwt")
  @OperationId("GetAccountingGeneralLedger")
  public async getGeneralLedger(
    @Request() request: AuthenticatedRequest,
    @Query() accountId?: number,
    @Query() partnerId?: number,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<GLEntryResponse[]> {
    const service = await this.getAccountingService(request);
    const entries = await service.getGLEntries({
      accountId,
      partnerId,
      dateFrom,
      dateTo,
    });

    // Map Odoo tuples to camelCase objects
    return entries.map((e) => ({
      id: e.id,
      moveId: Array.isArray(e.move_id) ? e.move_id[0] : e.move_id,
      moveName: Array.isArray(e.move_id) ? e.move_id[1] : undefined,
      date: e.date,
      accountId: Array.isArray(e.account_id) ? e.account_id[0] : e.account_id,
      accountName: Array.isArray(e.account_id) ? e.account_id[1] : undefined,
      partnerId: Array.isArray(e.partner_id) ? e.partner_id[0] : e.partner_id,
      partnerName: Array.isArray(e.partner_id) ? e.partner_id[1] : undefined,
      name: e.name,
      debit: e.debit,
      credit: e.credit,
      balance: e.balance,
      amountCurrency: e.amount_currency,
      currencyId: Array.isArray(e.currency_id) ? e.currency_id[0] : e.currency_id,
      currencyName: Array.isArray(e.currency_id) ? e.currency_id[1] : undefined,
      companyId: Array.isArray(e.company_id) ? e.company_id[0] : e.company_id,
      companyName: Array.isArray(e.company_id) ? e.company_id[1] : undefined,
    }));
  }

  // ==================== Payment Terms ====================

  @Get("payment-terms")
  @Security("jwt")
  @OperationId("GetAccountingPaymentTerms")
  public async getPaymentTerms(
    @Request() request: AuthenticatedRequest,
  ): Promise<{ id: number; name: string; note?: string }[]> {
    const service = await this.getAccountingService(request);
    return service.getPaymentTerms();
  }

  // ==================== Aged Reports ====================

  @Get("reports/aged-receivable")
  @Security("jwt")
  @OperationId("GetAccountingAgedReceivable")
  public async getAgedReceivable(
    @Request() request: AuthenticatedRequest,
    @Query() asOfDate?: string,
  ): Promise<
    {
      partnerId: number;
      partnerName: string;
      current: number;
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      days_over_90: number;
      total: number;
    }[]
  > {
    const service = await this.getAccountingService(request);
    return service.getAgedReceivables(asOfDate);
  }

  @Get("reports/aged-payable")
  @Security("jwt")
  @OperationId("GetAccountingAgedPayable")
  public async getAgedPayable(
    @Request() request: AuthenticatedRequest,
    @Query() asOfDate?: string,
  ): Promise<
    {
      partnerId: number;
      partnerName: string;
      current: number;
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      days_over_90: number;
      total: number;
    }[]
  > {
    const service = await this.getAccountingService(request);
    return service.getAgedPayables(asOfDate);
  }

  // ==================== Bank Reconciliation ====================

  @Get("bank-statements")
  @Security("jwt")
  @OperationId("GetAccountingBankStatements")
  public async getBankStatements(
    @Request() request: AuthenticatedRequest,
    @Query() journalId?: number,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
    @Query() state?: "open" | "confirm",
  ): Promise<
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
    const service = await this.getAccountingService(request);
    return service.getBankStatements({ journalId, dateFrom, dateTo, state });
  }

  @Get("bank-statements/{statementId}/lines")
  @Security("jwt")
  @OperationId("GetAccountingBankStatementLines")
  public async getBankStatementLines(
    @Request() request: AuthenticatedRequest,
    @Path() statementId: number,
  ): Promise<
    {
      id: number;
      date: string;
      paymentRef: string;
      partnerName?: string;
      amount: number;
      isReconciled: boolean;
    }[]
  > {
    const service = await this.getAccountingService(request);
    return service.getBankStatementLines(statementId);
  }

  @Get("bank-statements/lines/{lineId}/suggestions")
  @Security("jwt")
  @OperationId("GetAccountingReconciliationSuggestions")
  public async getReconciliationSuggestions(
    @Request() request: AuthenticatedRequest,
    @Path() lineId: number,
  ): Promise<
    {
      moveId: number;
      moveName: string;
      partnerName: string;
      date: string;
      amount: number;
    }[]
  > {
    const service = await this.getAccountingService(request);
    return service.getReconciliationSuggestions(lineId);
  }

  @Post("bank-statements/lines/{lineId}/reconcile")
  @Security("jwt")
  @OperationId("ReconcileAccountingBankStatementLine")
  public async reconcileBankStatementLine(
    @Request() request: AuthenticatedRequest,
    @Path() lineId: number,
    @Body() body: { moveIds: number[] },
  ): Promise<{ success: boolean; message?: string }> {
    const service = await this.getAccountingService(request);
    return service.reconcileBankStatementLine(lineId, body.moveIds);
  }

  // ==================== Multi-Currency ====================

  @Get("currencies")
  @Security("jwt")
  @OperationId("GetAccountingCurrencies")
  public async getCurrencies(
    @Request() request: AuthenticatedRequest,
    @Query() onlyActive = true,
  ): Promise<
    {
      id: number;
      name: string;
      symbol: string;
      position: "after" | "before";
      rounding: number;
      active: boolean;
    }[]
  > {
    const service = await this.getAccountingService(request);
    return service.getCurrencies(onlyActive);
  }

  @Get("currency-rates")
  @Security("jwt")
  @OperationId("GetAccountingCurrencyRates")
  public async getCurrencyRates(
    @Request() request: AuthenticatedRequest,
    @Query() currencyId?: number,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<
    {
      id: number;
      currencyId: number;
      currencyName: string;
      name: string;
      rate: number;
      companyId: number;
    }[]
  > {
    const service = await this.getAccountingService(request);
    return service.getCurrencyRates(currencyId, dateFrom, dateTo);
  }

  @Post("currency-convert")
  @Security("jwt")
  @OperationId("ConvertAccountingCurrency")
  public async convertCurrency(
    @Request() request: AuthenticatedRequest,
    @Body() body: { amount: number; fromCurrencyId: number; toCurrencyId: number; date?: string },
  ): Promise<{ convertedAmount: number; rate: number }> {
    const service = await this.getAccountingService(request);
    return service.convertCurrency(body.amount, body.fromCurrencyId, body.toCurrencyId, body.date);
  }

  // ==================== Batch Operations ====================

  @Post("invoices/batch-validate")
  @Security("jwt")
  @OperationId("BatchValidateAccountingInvoices")
  public async batchValidateInvoices(
    @Request() request: AuthenticatedRequest,
    @Body() body: { invoiceIds: number[] },
  ): Promise<{
    success: number[];
    failed: { id: number; error: string }[];
  }> {
    const service = await this.getAccountingService(request);
    return service.batchValidateInvoices(body.invoiceIds);
  }

  @Post("invoices/batch-cancel")
  @Security("jwt")
  @OperationId("BatchCancelAccountingInvoices")
  public async batchCancelInvoices(
    @Request() request: AuthenticatedRequest,
    @Body() body: { invoiceIds: number[] },
  ): Promise<{
    success: number[];
    failed: { id: number; error: string }[];
  }> {
    const service = await this.getAccountingService(request);
    return service.batchCancelInvoices(body.invoiceIds);
  }

  @Post("invoices/batch-create")
  @Security("jwt")
  @SuccessResponse("201", "Invoices created")
  @OperationId("BatchCreateAccountingInvoices")
  public async batchCreateInvoices(
    @Request() request: AuthenticatedRequest,
    @Body() body: { invoices: InvoiceCreateRequest[] },
  ): Promise<{
    success: { index: number; id: number }[];
    failed: { index: number; error: string }[];
  }> {
    const service = await this.getAccountingService(request);

    const dtos = body.invoices.map((inv) => ({
      moveType: inv.type === "SALES" ? ("out_invoice" as const) : ("in_invoice" as const),
      customerId: inv.type === "SALES" ? Number.parseInt(inv.customerId ?? "0") : undefined,
      supplierId: inv.type === "PURCHASE" ? Number.parseInt(inv.supplierId ?? "0") : undefined,
      invoiceDate: inv.date,
      dueDate: inv.dueDate,
      lines: inv.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }));

    this.setStatus(201);
    return service.batchCreateInvoices(dtos);
  }

  @Post("payments/batch-create")
  @Security("jwt")
  @SuccessResponse("201", "Payments created")
  @OperationId("BatchCreateAccountingPayments")
  public async batchCreatePayments(
    @Request() request: AuthenticatedRequest,
    @Body()
    body: {
      payments: {
        type: "inbound" | "outbound";
        partnerId: number;
        partnerType: "customer" | "supplier";
        amount: number;
        date: string;
        journalId: number;
        reference?: string;
      }[];
    },
  ): Promise<{
    success: { index: number; id: number }[];
    failed: { index: number; error: string }[];
  }> {
    const service = await this.getAccountingService(request);
    this.setStatus(201);
    return service.batchCreatePayments(body.payments);
  }

  @Post("payments/batch-confirm")
  @Security("jwt")
  @OperationId("BatchConfirmAccountingPayments")
  public async batchConfirmPayments(
    @Request() request: AuthenticatedRequest,
    @Body() body: { paymentIds: number[] },
  ): Promise<{
    success: number[];
    failed: { id: number; error: string }[];
  }> {
    const service = await this.getAccountingService(request);
    return service.batchConfirmPayments(body.paymentIds);
  }
}
