import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";

interface PayrollRecord {
  id: string;
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "DRAFT" | "PROCESSED" | "PAID";
}

interface PayrollCreateRequest {
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

@Route("payroll")
@Tags("HR & Payroll")
export class PayrollController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getPayrollRecords(
    @Query() _page: number = 1,
    @Query() _limit: number = 20,
    @Query() _period?: string,
  ): Promise<{
    records: PayrollRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new Error("Not implemented yet");
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Payroll record created successfully")
  public async createPayrollRecord(@Body() _request: PayrollCreateRequest): Promise<PayrollRecord> {
    throw new Error("Not implemented yet");
  }

  @Post("process")
  @Security("jwt")
  @SuccessResponse("200", "Payroll processed successfully")
  public async processPayroll(@Body() _request: { period: string }): Promise<{ message: string }> {
    throw new Error("Not implemented yet");
  }
}
