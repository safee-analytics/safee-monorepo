import { Controller } from "tsoa";
interface ContactCreateRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  type: "LEAD" | "PROSPECT" | "CUSTOMER" | "SUPPLIER";
  source?: string;
  notes?: string;
}
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  type: string;
  source?: string;
  createdAt: string;
}
export declare class ContactController extends Controller {
  /**
   * Get all contacts for the authenticated user's organization
   */
  getContacts(
    page?: number,
    limit?: number,
    type?: string,
  ): Promise<{
    contacts: Contact[];
    total: number;
    page: number;
    limit: number;
  }>;
  /**
   * Create a new contact
   */
  createContact(request: ContactCreateRequest): Promise<Contact>;
}
export {};
//# sourceMappingURL=contactController.d.ts.map
