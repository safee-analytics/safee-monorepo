// TSOA explicit types for HR Management
// These must match the database types

export type EmployeeType = "employee" | "student" | "trainee" | "contractor" | "freelance";
export type Gender = "male" | "female" | "other";
export type MaritalStatus = "single" | "married" | "cohabitant" | "widower" | "divorced";
export type ContractState = "draft" | "open" | "close" | "cancel";
export type WageType = "monthly" | "hourly";
export type LeaveState = "draft" | "confirm" | "refuse" | "validate1" | "validate" | "cancel";

// Employee DTOs
export interface EmployeeDbResponse {
  id: string;
  organizationId: string;
  userId?: string;
  odooEmployeeId?: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  workEmail?: string;
  workPhone?: string;
  workLocation?: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  employeeType?: EmployeeType;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  birthday?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  identificationId?: string;
  passportId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIban?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  hireDate?: string;
  terminationDate?: string;
  photoUrl?: string;
  notes?: string;
  active: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  userId?: string;
  odooEmployeeId?: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  workEmail?: string;
  workPhone?: string;
  workLocation?: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  employeeType?: EmployeeType;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  birthday?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  identificationId?: string;
  passportId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIban?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  hireDate?: string;
  terminationDate?: string;
  photoUrl?: string;
  notes?: string;
  active?: boolean;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  workEmail?: string;
  workPhone?: string;
  workLocation?: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  employeeType?: EmployeeType;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  birthday?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  identificationId?: string;
  passportId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIban?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  hireDate?: string;
  terminationDate?: string;
  photoUrl?: string;
  notes?: string;
  active?: boolean;
}

// Department DTOs
export interface DepartmentDbResponse {
  id: string;
  organizationId: string;
  odooDepartmentId?: number;
  name: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  color?: number;
  note?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  odooDepartmentId?: number;
  name: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  color?: number;
  note?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  color?: number;
  note?: string;
}

// Leave Balance DTOs
export interface LeaveBalanceResponse {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
}

// Sync DTOs
export interface SyncEmployeeFromOdooRequest {
  odooEmployeeId: number;
}

export interface SyncDepartmentFromOdooRequest {
  odooDepartmentId: number;
}

export interface SyncAllEmployeesResponse {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export interface SyncAllDepartmentsResponse {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}
