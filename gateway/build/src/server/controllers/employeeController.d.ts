import { Controller } from "tsoa";
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
export declare class EmployeeController extends Controller {
  getEmployees(
    _page?: number,
    _limit?: number,
  ): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
  }>;
  createEmployee(_request: EmployeeCreateRequest): Promise<Employee>;
}
export {};
