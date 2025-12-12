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
  userId?: string | null;
  odooEmployeeId?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  workLocation?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employeeType?: EmployeeType | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  birthday?: string | null;
  placeOfBirth?: string | null;
  countryOfBirth?: string | null;
  nationality?: string | null;
  identificationId?: string | null;
  passportId?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankIban?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  active: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  userId?: string | null;
  odooEmployeeId?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  workLocation?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employeeType?: EmployeeType | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  birthday?: string | null;
  placeOfBirth?: string | null;
  countryOfBirth?: string | null;
  nationality?: string | null;
  identificationId?: string | null;
  passportId?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankIban?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  active?: boolean | null;
}

export interface UpdateEmployeeRequest {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  workLocation?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employeeType?: EmployeeType | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  birthday?: string | null;
  placeOfBirth?: string | null;
  countryOfBirth?: string | null;
  nationality?: string | null;
  identificationId?: string | null;
  passportId?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankIban?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  active?: boolean | null;
}

// Department DTOs
export interface DepartmentDbResponse {
  id: string;
  organizationId: string;
  odooDepartmentId?: number | null;
  name: string;
  code?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  color?: number | null;
  note?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  odooDepartmentId?: number | null;
  name: string;
  code?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  color?: number | null;
  note?: string | null;
}

export interface UpdateDepartmentRequest {
  name?: string | null;
  code?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  color?: number | null;
  note?: string | null;
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
