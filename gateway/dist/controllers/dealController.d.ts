import { Controller } from "tsoa";
interface DealCreateRequest {
  title: string;
  value?: number;
  stage: "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
  probability?: number;
  expectedCloseDate?: string;
  contactId?: string;
  notes?: string;
}
interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: string;
  probability?: number;
  expectedCloseDate?: string;
  contactId?: string;
  createdAt: string;
}
export declare class DealController extends Controller {
  /**
   * Get all deals for the authenticated user's organization
   */
  getDeals(
    page?: number,
    limit?: number,
    stage?: string,
  ): Promise<{
    deals: Deal[];
    total: number;
    page: number;
    limit: number;
  }>;
  /**
   * Create a new deal
   */
  createDeal(request: DealCreateRequest): Promise<Deal>;
}
export {};
//# sourceMappingURL=dealController.d.ts.map
