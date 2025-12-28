// HR Controller DTOs - Odoo API Response Types
import type { OdooRelation } from "./shared.js";

export { OdooRelation };

export interface EmployeeResponse {
  id: number;
  name: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  job_title?: string;
  department_id?: OdooRelation;
  parent_id?: OdooRelation;
  address_id?: OdooRelation;
  work_location_id?: OdooRelation;
  user_id?: OdooRelation;
  employee_type?: string;
  gender?: string;
  marital?: string;
  birthday?: string;
  identification_id?: string;
  passport_id?: string;
  bank_account_id?: OdooRelation;
  emergency_contact?: string;
  emergency_phone?: string;
  visa_no?: string;
  visa_expire?: string;
  work_permit_no?: string;
  work_permit_expiration_date?: string;
  certificate?: string;
  study_field?: string;
  study_school?: string;
  place_of_birth?: string;
  country_of_birth?: OdooRelation;
  active?: boolean;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  complete_name?: string;
  manager_id?: OdooRelation;
  parent_id?: OdooRelation;
  company_id?: OdooRelation;
  active?: boolean;
  total_employee?: number;
  color?: number;
  note?: string;
}

export interface ContractResponse {
  id: number;
  name: string;
  employee_id: OdooRelation;
  date_start: string;
  date_end?: string;
  state: string;
  job_id?: OdooRelation;
  department_id?: OdooRelation;
  wage: number;
  wage_type: string;
  struct_id?: OdooRelation;
  resource_calendar_id?: OdooRelation;
  notes?: string;
}

export interface LeaveTypeResponse {
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

export interface LeaveRequestResponse {
  id: number;
  employee_id: OdooRelation;
  holiday_status_id: OdooRelation;
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
  manager_id?: OdooRelation;
  department_id?: OdooRelation;
}

export interface LeaveAllocationResponse {
  id: number;
  employee_id: OdooRelation;
  holiday_status_id: OdooRelation;
  number_of_days: number;
  number_of_days_display?: number;
  date_from?: string;
  date_to?: string;
  state: string;
  name?: string;
  notes?: string;
}

export interface PayslipResponse {
  id: number;
  number: string;
  employee_id: OdooRelation;
  date_from: string;
  date_to: string;
  state: string;
  basic_wage?: number;
  net_wage?: number;
  gross_wage?: number;
  contract_id?: OdooRelation;
  struct_id?: OdooRelation;
  credit_note?: boolean;
  paid_date?: string;
}

export interface PayslipLineResponse {
  id: number;
  slip_id: OdooRelation;
  name: string;
  code: string;
  category_id?: OdooRelation;
  sequence?: number;
  quantity?: number;
  rate?: number;
  amount: number;
}
