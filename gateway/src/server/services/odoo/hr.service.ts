import type { OdooClient } from "./client.service.js";
import { z } from "zod";

// Zod schemas for validation
const employeeTypeSchema = z.enum(["employee", "student", "trainee", "contractor", "freelance"]);
const genderSchema = z.enum(["male", "female", "other"]);
const maritalStatusSchema = z.enum(["single", "married", "cohabitant", "widower", "divorced"]);

export interface OdooEmployee {
  id: number;
  name: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  job_title?: string;
  department_id?: [number, string];
  parent_id?: [number, string];
  address_id?: [number, string];
  work_location_id?: [number, string];
  user_id?: [number, string];
  employee_type?: string;
  sex?: string; // Odoo uses 'sex' not 'gender'
  marital?: string;
  birthday?: string;
  identification_id?: string;
  passport_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  visa_no?: string;
  visa_expire?: string;
  permit_no?: string;
  work_permit_expiration_date?: string;
  certificate?: string;
  study_field?: string;
  study_school?: string;
  place_of_birth?: string;
  country_of_birth?: [number, string];
  active?: boolean;
}

// Helper functions to safely parse enum values
export function parseEmployeeType(value: string | undefined): z.infer<typeof employeeTypeSchema> | undefined {
  if (!value) return undefined;
  const result = employeeTypeSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export function parseGender(value: string | undefined): z.infer<typeof genderSchema> | undefined {
  if (!value) return undefined;
  const result = genderSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export function parseMaritalStatus(
  value: string | undefined,
): z.infer<typeof maritalStatusSchema> | undefined {
  if (!value) return undefined;
  const result = maritalStatusSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export interface OdooDepartment {
  id: number;
  name: string;
  complete_name?: string;
  manager_id?: [number, string];
  parent_id?: [number, string];
  company_id?: [number, string];
  active?: boolean;
  total_employee?: number;
  color?: number;
  note?: string;
}

export interface OdooContract {
  id: number;
  name: string;
  employee_id: [number, string];
  date_start: string;
  date_end?: string;
  state: string;
  job_id?: [number, string];
  department_id?: [number, string];
  wage: number;
  wage_type: string;
  struct_id?: [number, string];
  resource_calendar_id?: [number, string];
  notes?: string;
}

export interface OdooLeaveType {
  id: number;
  name: string;
  request_unit: string;
  time_type: string;
  color?: number;
  leave_validation_type?: string;
  requires_allocation?: boolean;
  employee_requests?: boolean;
  allocation_validation_type?: string;
  max_leaves?: number;
  unpaid?: boolean;
  active?: boolean;
  support_document?: boolean;
}

export interface OdooLeaveRequest {
  id: number;
  employee_id: [number, string];
  holiday_status_id: [number, string];
  date_from: string;
  date_to: string;
  number_of_days: number;
  state: string;
  request_date_from?: string;
  request_unit_half?: boolean;
  request_unit_hours?: boolean;
  request_hour_from?: string;
  request_hour_to?: string;
  notes?: string;
  manager_id?: [number, string];
  department_id?: [number, string];
}

export interface OdooLeaveAllocation {
  id: number;
  employee_id: [number, string];
  holiday_status_id: [number, string];
  number_of_days: number;
  number_of_days_display?: number;
  date_from?: string;
  date_to?: string;
  state: string;
  name?: string;
  notes?: string;
}

export interface OdooPayslip {
  id: number;
  number: string;
  employee_id: [number, string];
  date_from: string;
  date_to: string;
  state: string;
  basic_wage?: number;
  net_wage?: number;
  gross_wage?: number;
  contract_id?: [number, string];
  struct_id?: [number, string];
  credit_note?: boolean;
  paid_date?: string;
}

export interface OdooPayslipLine {
  id: number;
  slip_id: [number, string];
  name: string;
  code: string;
  category_id?: [number, string];
  sequence?: number;
  quantity?: number;
  rate?: number;
  amount: number;
}

export class OdooHRService {
  constructor(private readonly client: OdooClient) {}

  async getEmployees(filters?: { departmentId?: number; active?: boolean }): Promise<OdooEmployee[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.departmentId) {
      domain.push(["department_id", "=", filters.departmentId]);
    }
    if (filters?.active !== false) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooEmployee>("hr.employee", domain, [
      "name",
      "work_email",
      "work_phone",
      "mobile_phone",
      "job_title",
      "department_id",
      "parent_id",
      "address_id",
      "work_location_id",
      "user_id",
      "employee_type",
      "sex",
      "marital",
      "birthday",
      "identification_id",
      "passport_id",
      "emergency_contact",
      "emergency_phone",
      "visa_no",
      "visa_expire",
      "permit_no",
      "work_permit_expiration_date",
      "certificate",
      "study_field",
      "study_school",
      "place_of_birth",
      "country_of_birth",
      "active",
    ]);
  }

  async getEmployee(employeeId: number): Promise<OdooEmployee | null> {
    const employees = await this.client.read<OdooEmployee>(
      "hr.employee",
      [employeeId],
      [
        "name",
        "work_email",
        "work_phone",
        "mobile_phone",
        "job_title",
        "department_id",
        "parent_id",
        "address_id",
        "work_location_id",
        "user_id",
        "employee_type",
        "sex",
        "marital",
        "birthday",
        "identification_id",
        "passport_id",
        "emergency_contact",
        "emergency_phone",
        "visa_no",
        "visa_expire",
        "permit_no",
        "work_permit_expiration_date",
        "certificate",
        "study_field",
        "study_school",
        "place_of_birth",
        "country_of_birth",
        "active",
      ],
    );

    return employees.length > 0 ? employees[0] : null;
  }

  async getDepartments(filters?: { parentId?: number; active?: boolean }): Promise<OdooDepartment[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.parentId !== undefined) {
      domain.push(["parent_id", "=", filters.parentId]);
    }
    if (filters?.active !== false) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooDepartment>("hr.department", domain, [
      "name",
      "complete_name",
      "manager_id",
      "parent_id",
      "company_id",
      "active",
      "total_employee",
      "color",
      "note",
    ]);
  }

  async getDepartment(departmentId: number): Promise<OdooDepartment | null> {
    const departments = await this.client.read<OdooDepartment>(
      "hr.department",
      [departmentId],
      [
        "name",
        "complete_name",
        "manager_id",
        "parent_id",
        "company_id",
        "active",
        "total_employee",
        "color",
        "note",
      ],
    );

    return departments.length > 0 ? departments[0] : null;
  }

  async getContracts(filters?: { employeeId?: number; state?: string }): Promise<OdooContract[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.employeeId) {
      domain.push(["employee_id", "=", filters.employeeId]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }

    return this.client.searchRead<OdooContract>("hr.contract", domain, [
      "name",
      "employee_id",
      "date_start",
      "date_end",
      "state",
      "job_id",
      "department_id",
      "wage",
      "wage_type",
      "struct_id",
      "resource_calendar_id",
      "notes",
    ]);
  }

  async getContract(contractId: number): Promise<OdooContract | null> {
    const contracts = await this.client.read<OdooContract>(
      "hr.contract",
      [contractId],
      [
        "name",
        "employee_id",
        "date_start",
        "date_end",
        "state",
        "job_id",
        "department_id",
        "wage",
        "wage_type",
        "struct_id",
        "resource_calendar_id",
        "notes",
      ],
    );

    return contracts.length > 0 ? contracts[0] : null;
  }

  async getLeaveTypes(filters?: { active?: boolean }): Promise<OdooLeaveType[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.active !== false) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooLeaveType>("hr.leave.type", domain, [
      "name",
      "request_unit",
      "time_type",
      "color",
      "leave_validation_type",
      "requires_allocation",
      "employee_requests",
      "allocation_validation_type",
      "max_leaves",
      "unpaid",
      "active",
      "support_document",
    ]);
  }

  async getLeaveType(leaveTypeId: number): Promise<OdooLeaveType | null> {
    const leaveTypes = await this.client.read<OdooLeaveType>(
      "hr.leave.type",
      [leaveTypeId],
      [
        "name",
        "request_unit",
        "time_type",
        "color",
        "leave_validation_type",
        "requires_allocation",
        "employee_requests",
        "allocation_validation_type",
        "max_leaves",
        "unpaid",
        "active",
        "support_document",
      ],
    );

    return leaveTypes.length > 0 ? leaveTypes[0] : null;
  }

  async getLeaveRequests(filters?: {
    employeeId?: number;
    leaveTypeId?: number;
    state?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooLeaveRequest[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.employeeId) {
      domain.push(["employee_id", "=", filters.employeeId]);
    }
    if (filters?.leaveTypeId) {
      domain.push(["holiday_status_id", "=", filters.leaveTypeId]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }
    if (filters?.dateFrom) {
      domain.push(["date_from", ">=", filters.dateFrom]);
    }
    if (filters?.dateTo) {
      domain.push(["date_to", "<=", filters.dateTo]);
    }

    return this.client.searchRead<OdooLeaveRequest>("hr.leave", domain, [
      "employee_id",
      "holiday_status_id",
      "date_from",
      "date_to",
      "number_of_days",
      "state",
      "request_date_from",
      "request_unit_half",
      "request_unit_hours",
      "request_hour_from",
      "request_hour_to",
      "notes",
      "manager_id",
      "department_id",
    ]);
  }

  async getLeaveRequest(leaveId: number): Promise<OdooLeaveRequest | null> {
    const leaves = await this.client.read<OdooLeaveRequest>(
      "hr.leave",
      [leaveId],
      [
        "employee_id",
        "holiday_status_id",
        "date_from",
        "date_to",
        "number_of_days",
        "state",
        "request_date_from",
        "request_unit_half",
        "request_unit_hours",
        "request_hour_from",
        "request_hour_to",
        "notes",
        "manager_id",
        "department_id",
      ],
    );

    return leaves.length > 0 ? leaves[0] : null;
  }

  async getLeaveAllocations(filters?: {
    employeeId?: number;
    leaveTypeId?: number;
    state?: string;
  }): Promise<OdooLeaveAllocation[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.employeeId) {
      domain.push(["employee_id", "=", filters.employeeId]);
    }
    if (filters?.leaveTypeId) {
      domain.push(["holiday_status_id", "=", filters.leaveTypeId]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }

    return this.client.searchRead<OdooLeaveAllocation>("hr.leave.allocation", domain, [
      "employee_id",
      "holiday_status_id",
      "number_of_days",
      "number_of_days_display",
      "date_from",
      "date_to",
      "state",
      "name",
      "notes",
    ]);
  }

  async getLeaveAllocation(allocationId: number): Promise<OdooLeaveAllocation | null> {
    const allocations = await this.client.read<OdooLeaveAllocation>(
      "hr.leave.allocation",
      [allocationId],
      [
        "employee_id",
        "holiday_status_id",
        "number_of_days",
        "number_of_days_display",
        "date_from",
        "date_to",
        "state",
        "name",
        "notes",
      ],
    );

    return allocations.length > 0 ? allocations[0] : null;
  }

  async getPayslips(filters?: {
    employeeId?: number;
    state?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<OdooPayslip[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.employeeId) {
      domain.push(["employee_id", "=", filters.employeeId]);
    }
    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }
    if (filters?.dateFrom) {
      domain.push(["date_from", ">=", filters.dateFrom]);
    }
    if (filters?.dateTo) {
      domain.push(["date_to", "<=", filters.dateTo]);
    }

    return this.client.searchRead<OdooPayslip>("hr.payslip", domain, [
      "number",
      "employee_id",
      "date_from",
      "date_to",
      "state",
      "basic_wage",
      "net_wage",
      "gross_wage",
      "contract_id",
      "struct_id",
      "credit_note",
      "paid_date",
    ]);
  }

  async getPayslip(payslipId: number): Promise<OdooPayslip | null> {
    const payslips = await this.client.read<OdooPayslip>(
      "hr.payslip",
      [payslipId],
      [
        "number",
        "employee_id",
        "date_from",
        "date_to",
        "state",
        "basic_wage",
        "net_wage",
        "gross_wage",
        "contract_id",
        "struct_id",
        "credit_note",
        "paid_date",
      ],
    );

    return payslips.length > 0 ? payslips[0] : null;
  }

  async getPayslipLines(payslipId: number): Promise<OdooPayslipLine[]> {
    return this.client.searchRead<OdooPayslipLine>(
      "hr.payslip.line",
      [["slip_id", "=", payslipId]],
      ["slip_id", "name", "code", "category_id", "sequence", "quantity", "rate", "amount"],
    );
  }

  // ==================== Write Operations ====================

  /**
   * Create or update an employee in Odoo
   * Returns the Odoo employee ID
   */
  async upsertEmployee(data: {
    odooEmployeeId?: number;
    odooUserId?: number;
    name: string;
    workEmail?: string;
    workPhone?: string;
    mobilePhone?: string;
    jobTitle?: string;
    departmentId?: number;
    managerId?: number;
    employeeType?: string;
    gender?: string;
    maritalStatus?: string;
    birthday?: string;
    identificationId?: string;
    passportId?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    placeOfBirth?: string;
    active?: boolean;
  }): Promise<number> {
    let odooData: Record<string, unknown> = {
      name: data.name,
      work_email: data.workEmail,
      work_phone: data.workPhone,
      mobile_phone: data.mobilePhone,
      job_title: data.jobTitle,
      employee_type: data.employeeType,
      sex: data.gender,
      marital: data.maritalStatus,
      birthday: data.birthday,
      identification_id: data.identificationId,
      passport_id: data.passportId,
      emergency_contact: data.emergencyContact,
      emergency_phone: data.emergencyPhone,
      place_of_birth: data.placeOfBirth,
      active: data.active ?? true,
    };

    // Add relational fields if provided
    if (data.departmentId) {
      odooData.department_id = data.departmentId;
    }
    if (data.managerId) {
      odooData.parent_id = data.managerId;
    }
    if (data.odooUserId) {
      odooData.user_id = data.odooUserId;
    }

    // Remove undefined values
    const filteredEntries = Object.entries(odooData).filter(([, value]) => value !== undefined);
    odooData = Object.fromEntries(filteredEntries) as typeof odooData;

    if (data.odooEmployeeId) {
      // Update existing employee
      await this.client.write("hr.employee", [data.odooEmployeeId], odooData);
      return data.odooEmployeeId;
    }
    // Create new employee
    const newId = await this.client.create("hr.employee", odooData);
    return newId;
  }

  /**
   * Deactivate an employee in Odoo
   */
  async deactivateEmployee(odooEmployeeId: number): Promise<void> {
    await this.client.write("hr.employee", [odooEmployeeId], { active: false });
  }

  /**
   * Create or update a department in Odoo
   * Returns the Odoo department ID
   */
  async upsertDepartment(data: {
    odooDepartmentId?: number;
    name: string;
    parentId?: number;
    managerId?: number;
    color?: number;
    note?: string;
    active?: boolean;
  }): Promise<number> {
    let odooData: Record<string, unknown> = {
      name: data.name,
      color: data.color,
      note: data.note,
      active: data.active ?? true,
    };

    if (data.parentId) {
      odooData.parent_id = data.parentId;
    }
    if (data.managerId) {
      odooData.manager_id = data.managerId;
    }

    // Remove undefined values
    const filteredEntries = Object.entries(odooData).filter(([, value]) => value !== undefined);
    odooData = Object.fromEntries(filteredEntries) as typeof odooData;

    if (data.odooDepartmentId) {
      // Update existing department
      await this.client.write("hr.department", [data.odooDepartmentId], odooData);
      return data.odooDepartmentId;
    }
    // Create new department
    const newId = await this.client.create("hr.department", odooData);
    return newId;
  }

  /**
   * Delete a department in Odoo
   */
  async deleteDepartment(odooDepartmentId: number): Promise<void> {
    await this.client.unlink("hr.department", [odooDepartmentId]);
  }
}
