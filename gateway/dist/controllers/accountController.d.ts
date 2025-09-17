import { Controller } from "tsoa";
interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
}
export declare class AccountController extends Controller {
  /**
   * Get chart of accounts
   */
  getAccounts(): Promise<Account[]>;
}
export {};
//# sourceMappingURL=accountController.d.ts.map
