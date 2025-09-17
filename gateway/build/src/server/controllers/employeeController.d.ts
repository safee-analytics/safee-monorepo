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
    getEmployees(page?: number, limit?: number): Promise<{
        employees: Employee[];
        total: number;
        page: number;
        limit: number;
    }>;
    createEmployee(request: EmployeeCreateRequest): Promise<Employee>;
}
export {};
