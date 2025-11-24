import type {
  hrEmployees,
  hrDepartments,
  hrContracts,
  hrPayslips,
  hrPayslipLines,
  hrLeaveTypes,
  hrLeaveRequests,
  hrLeaveAllocations,
} from "../drizzle/index.js";

export type Employee = typeof hrEmployees.$inferSelect;
export type CreateEmployeeInput = typeof hrEmployees.$inferInsert;
export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, "id" | "organizationId" | "createdAt">>;

export type Department = typeof hrDepartments.$inferSelect;
export type CreateDepartmentInput = typeof hrDepartments.$inferInsert;
export type UpdateDepartmentInput = Partial<
  Omit<CreateDepartmentInput, "id" | "organizationId" | "createdAt">
>;

export type Contract = typeof hrContracts.$inferSelect;
export type CreateContractInput = typeof hrContracts.$inferInsert;
export type UpdateContractInput = Partial<Omit<CreateContractInput, "id" | "organizationId" | "createdAt">>;

export type Payslip = typeof hrPayslips.$inferSelect;
export type CreatePayslipInput = typeof hrPayslips.$inferInsert;
export type UpdatePayslipInput = Partial<Omit<CreatePayslipInput, "id" | "organizationId" | "createdAt">>;

export type PayslipLine = typeof hrPayslipLines.$inferSelect;
export type CreatePayslipLineInput = typeof hrPayslipLines.$inferInsert;

export type LeaveType = typeof hrLeaveTypes.$inferSelect;
export type CreateLeaveTypeInput = typeof hrLeaveTypes.$inferInsert;
export type UpdateLeaveTypeInput = Partial<Omit<CreateLeaveTypeInput, "id" | "organizationId" | "createdAt">>;

export type LeaveRequest = typeof hrLeaveRequests.$inferSelect;
export type CreateLeaveRequestInput = typeof hrLeaveRequests.$inferInsert;
export type UpdateLeaveRequestInput = Partial<
  Omit<CreateLeaveRequestInput, "id" | "organizationId" | "createdAt">
>;

export type LeaveAllocation = typeof hrLeaveAllocations.$inferSelect;
export type CreateLeaveAllocationInput = typeof hrLeaveAllocations.$inferInsert;
export type UpdateLeaveAllocationInput = Partial<
  Omit<CreateLeaveAllocationInput, "id" | "organizationId" | "createdAt">
>;

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
}

export interface EmployeeWithRelations extends Employee {
  department?: Department | null;
  manager?: Employee | null;
  currentContract?: Contract | null;
}
