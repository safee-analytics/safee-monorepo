import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";

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

@Route("accounts")
@Tags("Accounting")
export class AccountController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getAccounts(@Query() type?: string): Promise<Account[]> {
    throw new Error("Not implemented yet");
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Account created successfully")
  public async createAccount(@Body() request: AccountCreateRequest): Promise<Account> {
    throw new Error("Not implemented yet");
  }
}
