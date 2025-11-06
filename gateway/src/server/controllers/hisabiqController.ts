import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse, OperationId } from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";
import { NotImplemented } from "../errors.js";

@Route("hisabiq")
@Tags("Hisabiq (Accounting)")
export class HisabiqController extends Controller {
  /**
   * Get all invoices for the authenticated user's organization
   */
  @Get("invoices")
  @Security("jwt")
  @OperationId("GetHisabiqInvoices")
  public async getInvoices(
    @Query() _page: number = 1,
    @Query() _limit: number = 20,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    // TODO: Implement get invoices logic
    throw new NotImplemented();
  }

  /**
   * Create a new invoice
   */
  @Post("invoices")
  @Security("jwt")
  @SuccessResponse("201", "Invoice created successfully")
  @OperationId("CreateHisabiqInvoice")
  public async createInvoice(@Body() _request: InvoiceCreateRequest): Promise<Invoice> {
    // TODO: Implement create invoice logic
    throw new NotImplemented();
  }

  /**
   * Get chart of accounts
   */
  @Get("accounts")
  @Security("jwt")
  @OperationId("GetHisabiqAccounts")
  public async getAccounts(): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      type: string;
      parentId?: string;
    }>
  > {
    // TODO: Implement get accounts logic
    throw new NotImplemented();
  }
}
