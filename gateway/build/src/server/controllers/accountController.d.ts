import { Controller } from "tsoa";
interface Account {
    id: string;
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    balance: number;
    parentId?: string;
}
interface AccountCreateRequest {
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    parentId?: string;
}
export declare class AccountController extends Controller {
    getAccounts(type?: string): Promise<Account[]>;
    createAccount(request: AccountCreateRequest): Promise<Account>;
}
export {};
