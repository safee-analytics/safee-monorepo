import { Controller } from "tsoa";
import type { Invoice, InvoiceCreateRequest } from "../types/invoice.js";
export declare class HisabiqController extends Controller {
    /**
     * Get all invoices for the authenticated user's organization
     */
    getInvoices(page?: number, limit?: number): Promise<{
        invoices: Invoice[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Create a new invoice
     */
    createInvoice(request: InvoiceCreateRequest): Promise<Invoice>;
    /**
     * Get chart of accounts
     */
    getAccounts(): Promise<Array<{
        id: string;
        code: string;
        name: string;
        type: string;
        parentId?: string;
    }>>;
}
