import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";

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

@Route("deals")
@Tags("CRM")
export class DealController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getDeals(
    @Query() page: number = 1,
    @Query() limit: number = 20,
    @Query() stage?: string,
  ): Promise<{
    deals: Deal[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new Error("Not implemented yet");
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Deal created successfully")
  public async createDeal(@Body() request: DealCreateRequest): Promise<Deal> {
    throw new Error("Not implemented yet");
  }
}
