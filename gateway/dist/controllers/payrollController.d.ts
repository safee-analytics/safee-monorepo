import { Controller } from "tsoa";
interface PayrollRecord {
  id: string;
  employeeId: string;
  payPeriod: string;
  baseSalary: number;
  netPay: number;
  payDate: string;
}
export declare class PayrollController extends Controller {
  /**
   * Get payroll records
   */
  getPayrollRecords(employeeId?: string, payPeriod?: string): Promise<PayrollRecord[]>;
  /**
   * Generate payroll for a pay period
   */
  generatePayroll(request: { payPeriod: string }): Promise<{
    message: string;
    recordsCreated: number;
  }>;
}
export {};
//# sourceMappingURL=payrollController.d.ts.map
