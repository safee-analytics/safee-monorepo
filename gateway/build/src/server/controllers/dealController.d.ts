import { Controller } from "tsoa";
interface Deal {
    id: string;
    title: string;
    value: number;
    stage: "PROSPECT" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
    contactId: string;
    expectedCloseDate: string;
    probability: number;
}
interface DealCreateRequest {
    title: string;
    value: number;
    contactId: string;
    expectedCloseDate: string;
    probability: number;
}
export declare class DealController extends Controller {
    getDeals(_page?: number, _limit?: number, _stage?: string): Promise<{
        deals: Deal[];
        total: number;
        page: number;
        limit: number;
    }>;
    createDeal(_request: DealCreateRequest): Promise<Deal>;
}
export {};
