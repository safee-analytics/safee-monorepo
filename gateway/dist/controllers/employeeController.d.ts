import { Controller } from "tsoa";
interface EmployeeCreateRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  hireDate: string;
  department?: string;
  position?: string;
  salary?: number;
}
interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
  position?: string;
  salary?: number;
  status: string;
  hireDate: string;
}
export declare class EmployeeController extends Controller {
  /**
   * Get all employees for the authenticated user's organization
   */
  getEmployees(
    page?: number,
    limit?: number,
  ): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
  }>;
  /**
   * Create a new employee
   */
  createEmployee(request: EmployeeCreateRequest): Promise<Employee>;
}
export {};
//# sourceMappingURL=employeeController.d.ts.map
