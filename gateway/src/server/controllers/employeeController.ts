import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  salary: number;
  startDate: string;
}

interface EmployeeCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  salary: number;
  startDate: string;
}

@Route("employees")
@Tags("HR & Payroll")
export class EmployeeController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getEmployees(
    @Query() _page: number = 1,
    @Query() _limit: number = 20,
  ): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new Error("Not implemented yet");
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Employee created successfully")
  public async createEmployee(@Body() _request: EmployeeCreateRequest): Promise<Employee> {
    throw new Error("Not implemented yet");
  }
}
