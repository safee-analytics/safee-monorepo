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
    getPayrollRecords(_page?: number, _limit?: number, _period?: string): Promise<{
        records: PayrollRecord[];
        total: number;
        page: number;
        limit: number;
    }>;
    createPayrollRecord(_request: PayrollCreateRequest): Promise<PayrollRecord>;
    processPayroll(_request: {
        period: string;
    }): Promise<{
        message: string;
    }>;
}
export {};
