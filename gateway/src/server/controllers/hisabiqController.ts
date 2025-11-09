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
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import { OdooAccountingService } from "../services/odoo/accounting.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type {
  CreatePaymentDTO,
  AccountBalanceQuery,
  PartnerLedgerQuery,
} from "../services/odoo/accounting.types.js";
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

@Route("hisabiq")
@Tags("Hisabiq (Accounting)")
export class HisabiqController extends Controller {
  @NoSecurity()
  private async getAccountingService(request: AuthenticatedRequest): Promise<OdooAccountingService> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await getOdooClientManager().getClient(userId, organizationId);
    return new OdooAccountingService(client);
  }

  @Get("invoices")
  @Security("jwt")
  @OperationId("GetHisabiqInvoices")
  public async getInvoices(
    @Request() request: AuthenticatedRequest,
    @Query() page: number = 1,
    @Query() limit: number = 20,
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
      number: inv.name || "Draft",
      type: inv.move_type === "out_invoice" ? "SALES" : "PURCHASE",
      date: inv.invoice_date || "",
      total: inv.amount_total || 0,
      status: inv.state || "draft",
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
  @OperationId("GetHisabiqInvoice")
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
      number: invoice.name || "Draft",
      type: invoice.move_type === "out_invoice" ? "SALES" : "PURCHASE",
      date: invoice.invoice_date || "",
      total: invoice.amount_total || 0,
      status: invoice.state || "draft",
    };
  }

  @Post("invoices")
  @Security("jwt")
  @SuccessResponse("201", "Invoice created successfully")
  @OperationId("CreateHisabiqInvoice")
  public async createInvoice(
    @Request() request: AuthenticatedRequest,
    @Body() invoiceRequest: InvoiceCreateRequest,
  ): Promise<Invoice> {
    const service = await this.getAccountingService(request);

    const customerId =
      invoiceRequest.type === "SALES"
        ? Number.parseInt(invoiceRequest.customerId || "0")
        : Number.parseInt(invoiceRequest.supplierId || "0");

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
      number: odooInvoice.name || "Draft",
      type: invoiceRequest.type,
      date: odooInvoice.invoice_date || invoiceRequest.date,
      total: odooInvoice.amount_total || 0,
      status: odooInvoice.state || "draft",
    };
  }

  @Post("invoices/{invoiceId}/validate")
  @Security("jwt")
  @OperationId("ValidateHisabiqInvoice")
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
  @OperationId("CancelHisabiqInvoice")
  public async cancelInvoice(
    @Request() request: AuthenticatedRequest,
    @Path() invoiceId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.getAccountingService(request);
    await service.cancelInvoice(Number.parseInt(invoiceId));
    return { success: true };
  }

  @Get("accounts")
  @Security("jwt")
  @OperationId("GetHisabiqAccounts")
  public async getAccounts(
    @Request() request: AuthenticatedRequest,
    @Query() accountType?: string,
  ): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      type: string;
      parentId?: string;
    }>
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
  @OperationId("SearchHisabiqAccounts")
  public async searchAccounts(
    @Request() request: AuthenticatedRequest,
    @Query() q: string,
  ): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      type: string;
    }>
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
  @OperationId("GetHisabiqPayments")
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
  @OperationId("CreateHisabiqPayment")
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
  @OperationId("ConfirmHisabiqPayment")
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
  @OperationId("GetHisabiqPartners")
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
  @OperationId("GetHisabiqJournals")
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
  @OperationId("GetHisabiqTaxes")
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
  @OperationId("GetHisabiqTrialBalance")
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
  @OperationId("GetHisabiqPartnerLedger")
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
  @OperationId("GetHisabiqProfitLoss")
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
  @OperationId("GetHisabiqGeneralLedger")
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
}
