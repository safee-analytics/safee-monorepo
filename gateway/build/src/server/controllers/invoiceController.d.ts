import { Controller } from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";
export declare class InvoiceController extends Controller {
    getInvoices(page?: number, limit?: number): Promise<{
        invoices: Invoice[];
        total: number;
        page: number;
        limit: number;
    }>;
    createInvoice(request: InvoiceCreateRequest): Promise<Invoice>;
}
