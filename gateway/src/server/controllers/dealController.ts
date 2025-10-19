import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";
import { NotImplemented } from "../errors.js";

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
    @Query() _page: number = 1,
    @Query() _limit: number = 20,
    @Query() _stage?: string,
  ): Promise<{
    deals: Deal[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new NotImplemented();
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Deal created successfully")
  public async createDeal(@Body() _request: DealCreateRequest): Promise<Deal> {
    throw new NotImplemented();
  }
}
