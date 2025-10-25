import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";
import { NotImplemented } from "../errors.js";

@Route("invoices")
@Tags("Invoices")
export class InvoiceController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getInvoices(
    @Query() _page: number = 1,
    @Query() _limit: number = 20,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new NotImplemented();
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Invoice created successfully")
  public async createInvoice(@Body() _request: InvoiceCreateRequest): Promise<Invoice> {
    throw new NotImplemented();
  }
}
