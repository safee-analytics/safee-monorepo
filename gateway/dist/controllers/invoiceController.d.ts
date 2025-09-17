import { Controller } from "tsoa";
import { Invoice, InvoiceCreateRequest } from "../types/invoice";
export declare class InvoiceController extends Controller {
  /**
   * Get all invoices for the authenticated user's organization
   */
  getInvoices(
    page?: number,
    limit?: number,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
  }>;
  /**
   * Create a new invoice
   */
  createInvoice(request: InvoiceCreateRequest): Promise<Invoice>;
}
//# sourceMappingURL=invoiceController.d.ts.map
