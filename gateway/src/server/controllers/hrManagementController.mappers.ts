import type { Employee, Department } from "@safee/database";
import type { EmployeeDbResponse, DepartmentDbResponse } from "../dtos/hrManagement.js";

export function mapEmployeeToResponse(emp: Employee): EmployeeDbResponse {
  return {
    id: emp.id,
    organizationId: emp.organizationId,
    userId: emp.userId,
    odooEmployeeId: emp.odooEmployeeId ,
    name: emp.name,
    email: emp.email ,
    phone: emp.phone ,
    mobile: emp.mobile ,
    workEmail: emp.workEmail ,
    workPhone: emp.workPhone ,
    workLocation: emp.workLocation ,
    jobTitle: emp.jobTitle ,
    departmentId: emp.departmentId ,
    managerId: emp.managerId ,
    employeeType: emp.employeeType ,
    gender: emp.gender ,
    maritalStatus: emp.maritalStatus ,
    birthday: emp.birthday ,
    placeOfBirth: emp.placeOfBirth ,
    countryOfBirth: emp.countryOfBirth ,
    nationality: emp.nationality ,
    identificationId: emp.identificationId ,
    passportId: emp.passportId ,
    bankAccountNumber: emp.bankAccountNumber ,
    bankName: emp.bankName ,
    bankIban: emp.bankIban ,
    emergencyContact: emp.emergencyContact ,
    emergencyPhone: emp.emergencyPhone ,
    emergencyRelation: emp.emergencyRelation ,
    hireDate: emp.hireDate ,
    terminationDate: emp.terminationDate ,
    photoUrl: emp.photoUrl ,
    notes: emp.notes ,
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
    odooDepartmentId: dept.odooDepartmentId ,
    name: dept.name,
    code: dept.code ,
    parentId: dept.parentId ,
    managerId: dept.managerId ,
    color: dept.color ,
    note: dept.note ,
    lastSyncedAt: dept.lastSyncedAt?.toISOString(),
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}
