import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";

@Route("invoices")
@Tags("Invoices")
export class InvoiceController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getInvoices(
    @Query() page: number = 1,
    @Query() limit: number = 20,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new Error("Not implemented yet");
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Invoice created successfully")
  public async createInvoice(@Body() request: InvoiceCreateRequest): Promise<Invoice> {
    throw new Error("Not implemented yet");
  }
}
