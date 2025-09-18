import { Controller } from "tsoa";
interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    type: "LEAD" | "CUSTOMER" | "VENDOR";
    status: "ACTIVE" | "INACTIVE";
}
interface ContactCreateRequest {
    name: string;
    email: string;
    phone: string;
    company?: string;
    type: "LEAD" | "CUSTOMER" | "VENDOR";
}
export declare class ContactController extends Controller {
    getContacts(_page?: number, _limit?: number, _type?: string): Promise<{
        contacts: Contact[];
        total: number;
        page: number;
        limit: number;
    }>;
    createContact(_request: ContactCreateRequest): Promise<Contact>;
}
export {};
