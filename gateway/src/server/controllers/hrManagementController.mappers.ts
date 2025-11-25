import type { Employee, Department } from "@safee/database";
import type { EmployeeDbResponse, DepartmentDbResponse } from "../dtos/hrManagement.js";

export function mapEmployeeToResponse(emp: Employee): EmployeeDbResponse {
  return {
    id: emp.id,
    organizationId: emp.organizationId,
    userId: emp.userId ?? undefined,
    odooEmployeeId: emp.odooEmployeeId ?? undefined,
    name: emp.name,
    email: emp.email ?? undefined,
    phone: emp.phone ?? undefined,
    mobile: emp.mobile ?? undefined,
    workEmail: emp.workEmail ?? undefined,
    workPhone: emp.workPhone ?? undefined,
    workLocation: emp.workLocation ?? undefined,
    jobTitle: emp.jobTitle ?? undefined,
    departmentId: emp.departmentId ?? undefined,
    managerId: emp.managerId ?? undefined,
    employeeType: emp.employeeType ?? undefined,
    gender: emp.gender ?? undefined,
    maritalStatus: emp.maritalStatus ?? undefined,
    birthday: emp.birthday ?? undefined,
    placeOfBirth: emp.placeOfBirth ?? undefined,
    countryOfBirth: emp.countryOfBirth ?? undefined,
    nationality: emp.nationality ?? undefined,
    identificationId: emp.identificationId ?? undefined,
    passportId: emp.passportId ?? undefined,
    bankAccountNumber: emp.bankAccountNumber ?? undefined,
    bankName: emp.bankName ?? undefined,
    bankIban: emp.bankIban ?? undefined,
    emergencyContact: emp.emergencyContact ?? undefined,
    emergencyPhone: emp.emergencyPhone ?? undefined,
    emergencyRelation: emp.emergencyRelation ?? undefined,
    hireDate: emp.hireDate ?? undefined,
    terminationDate: emp.terminationDate ?? undefined,
    photoUrl: emp.photoUrl ?? undefined,
    notes: emp.notes ?? undefined,
    active: emp.active,
    lastSyncedAt: emp.lastSyncedAt?.toISOString(),
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
  };
}

export function mapDepartmentToResponse(dept: Department): DepartmentDbResponse {
  return {
    id: dept.id,
    organizationId: dept.organizationId,
    odooDepartmentId: dept.odooDepartmentId ?? undefined,
    name: dept.name,
    code: dept.code ?? undefined,
    parentId: dept.parentId ?? undefined,
    managerId: dept.managerId ?? undefined,
    color: dept.color ?? undefined,
    note: dept.note ?? undefined,
    lastSyncedAt: dept.lastSyncedAt?.toISOString(),
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}
