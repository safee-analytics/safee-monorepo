import { Controller } from "tsoa";
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
export declare class PayrollController extends Controller {
    getPayrollRecords(page?: number, limit?: number, period?: string): Promise<{
        records: PayrollRecord[];
        total: number;
        page: number;
        limit: number;
    }>;
    createPayrollRecord(request: PayrollCreateRequest): Promise<PayrollRecord>;
    processPayroll(request: {
        period: string;
    }): Promise<{
        message: string;
    }>;
}
export {};
