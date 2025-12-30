/**
 * Mappers to convert Odoo tuple format [id, name] to proper objects
 */

import type { odoo } from "@safee/database";
type OdooEmployee = odoo.OdooEmployee;
type OdooDepartment = odoo.OdooDepartment;
type OdooContract = odoo.OdooContract;
type OdooLeaveType = odoo.OdooLeaveType;
type OdooLeaveRequest = odoo.OdooLeaveRequest;
type OdooLeaveAllocation = odoo.OdooLeaveAllocation;
type OdooPayslip = odoo.OdooPayslip;
type OdooPayslipLine = odoo.OdooPayslipLine;
import type {
  EmployeeResponse,
  DepartmentResponse,
  ContractResponse,
  LeaveTypeResponse,
  LeaveRequestResponse,
  LeaveAllocationResponse,
  PayslipResponse,
  PayslipLineResponse,
  OdooRelation,
} from "../dtos/hr.js";

function mapRelation(tuple: [number, string] | undefined): OdooRelation | undefined {
  if (!tuple) return undefined;
  return { id: tuple[0], name: tuple[1] };
}

export function mapEmployee(employee: OdooEmployee): EmployeeResponse {
  return {
    id: employee.id,
    name: employee.name,
    work_email: employee.work_email,
    work_phone: employee.work_phone,
    mobile_phone: employee.mobile_phone,
    job_title: employee.job_title,
    department_id: mapRelation(employee.department_id),
    parent_id: mapRelation(employee.parent_id),
    address_id: mapRelation(employee.address_id),
    work_location_id: mapRelation(employee.work_location_id),
    user_id: mapRelation(employee.user_id),
    employee_type: employee.employee_type,
    gender: employee.gender,
    marital: employee.marital,
    birthday: employee.birthday,
    identification_id: employee.identification_id,
    passport_id: employee.passport_id,
    emergency_contact: employee.emergency_contact,
    emergency_phone: employee.emergency_phone,
    visa_no: employee.visa_no,
    visa_expire: employee.visa_expire,
    work_permit_no: employee.permit_no,
    work_permit_expiration_date: employee.work_permit_expiration_date,
    certificate: employee.certificate,
    study_field: employee.study_field,
    study_school: employee.study_school,
    place_of_birth: employee.place_of_birth,
    country_of_birth: mapRelation(employee.country_of_birth),
    active: employee.active,
  };
}

export function mapDepartment(department: OdooDepartment): DepartmentResponse {
  return {
    id: department.id,
    name: department.name,
    complete_name: department.complete_name,
    manager_id: mapRelation(department.manager_id),
    parent_id: mapRelation(department.parent_id),
    company_id: mapRelation(department.company_id),
    active: department.active,
    total_employee: department.total_employee,
    color: department.color,
    note: department.note,
  };
}

export function mapContract(contract: OdooContract): ContractResponse {
  return {
    id: contract.id,
    name: contract.name,
    employee_id: { id: contract.employee_id[0], name: contract.employee_id[1] },
    date_start: contract.date_start,
    date_end: contract.date_end,
    state: contract.state,
    job_id: mapRelation(contract.job_id),
    department_id: mapRelation(contract.department_id),
    wage: contract.wage,
    wage_type: contract.wage_type,
    struct_id: mapRelation(contract.struct_id),
    resource_calendar_id: mapRelation(contract.resource_calendar_id),
    notes: contract.notes,
  };
}

export function mapLeaveType(leaveType: OdooLeaveType): LeaveTypeResponse {
  return {
    id: leaveType.id,
    name: leaveType.name,
    request_unit: leaveType.request_unit,
    time_type: leaveType.time_type,
    color: leaveType.color,
    leave_validation_type: leaveType.leave_validation_type,
    requires_allocation: leaveType.requires_allocation,
    employee_requests: leaveType.employee_requests,
    allocation_validation_type: leaveType.allocation_validation_type,
    max_leaves: leaveType.max_leaves,
    unpaid: leaveType.unpaid,
    active: leaveType.active,
    support_document: leaveType.support_document,
  };
}

export function mapLeaveRequest(leaveRequest: OdooLeaveRequest): LeaveRequestResponse {
  return {
    id: leaveRequest.id,
    employee_id: { id: leaveRequest.employee_id[0], name: leaveRequest.employee_id[1] },
    holiday_status_id: { id: leaveRequest.holiday_status_id[0], name: leaveRequest.holiday_status_id[1] },
    date_from: leaveRequest.date_from,
    date_to: leaveRequest.date_to,
    number_of_days: leaveRequest.number_of_days,
    state: leaveRequest.state,
    request_date_from: leaveRequest.request_date_from,
    request_unit_half: leaveRequest.request_unit_half,
    request_unit_hours: leaveRequest.request_unit_hours,
    request_hour_from: leaveRequest.request_hour_from,
    request_hour_to: leaveRequest.request_hour_to,
    notes: leaveRequest.notes,
    manager_id: mapRelation(leaveRequest.manager_id),
    department_id: mapRelation(leaveRequest.department_id),
  };
}

export function mapLeaveAllocation(allocation: OdooLeaveAllocation): LeaveAllocationResponse {
  return {
    id: allocation.id,
    employee_id: { id: allocation.employee_id[0], name: allocation.employee_id[1] },
    holiday_status_id: { id: allocation.holiday_status_id[0], name: allocation.holiday_status_id[1] },
    number_of_days: allocation.number_of_days,
    number_of_days_display: allocation.number_of_days_display,
    date_from: allocation.date_from,
    date_to: allocation.date_to,
    state: allocation.state,
    name: allocation.name,
    notes: allocation.notes,
  };
}

export function mapPayslip(payslip: OdooPayslip): PayslipResponse {
  return {
    id: payslip.id,
    number: payslip.number,
    employee_id: { id: payslip.employee_id[0], name: payslip.employee_id[1] },
    date_from: payslip.date_from,
    date_to: payslip.date_to,
    state: payslip.state,
    basic_wage: payslip.basic_wage,
    net_wage: payslip.net_wage,
    gross_wage: payslip.gross_wage,
    contract_id: mapRelation(payslip.contract_id),
    struct_id: mapRelation(payslip.struct_id),
    credit_note: payslip.credit_note,
    paid_date: payslip.paid_date,
  };
}

export function mapPayslipLine(line: OdooPayslipLine): PayslipLineResponse {
  return {
    id: line.id,
    slip_id: { id: line.slip_id[0], name: line.slip_id[1] },
    name: line.name,
    code: line.code,
    category_id: mapRelation(line.category_id),
    sequence: line.sequence,
    quantity: line.quantity,
    rate: line.rate,
    amount: line.amount,
  };
}
