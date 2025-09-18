import { Controller } from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";
export declare class InvoiceController extends Controller {
  getInvoices(
    _page?: number,
    _limit?: number,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
  }>;
  createInvoice(_request: InvoiceCreateRequest): Promise<Invoice>;
}
