import { z } from "zod";

export const departmentDbResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  odooDepartmentId: z.number().optional(),
  name: z.string(),
  code: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  color: z.number().optional(),
  note: z.string().optional(),
  lastSyncedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DepartmentDbResponse = z.infer<typeof departmentDbResponseSchema>;

export const employeeDbResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string().optional(),
  odooEmployeeId: z.number().optional(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  workEmail: z.string().optional(),
  workPhone: z.string().optional(),
  workLocation: z.string().optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  employeeType: z.enum(["employee", "student", "trainee", "contractor", "freelance"]).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  maritalStatus: z.enum(["single", "married", "cohabitant", "widower", "divorced"]).optional(),
  birthday: z.string().optional(),
  placeOfBirth: z.string().optional(),
  countryOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  identificationId: z.string().optional(),
  passportId: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankIban: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  hireDate: z.string().optional(),
  terminationDate: z.string().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean(),
  lastSyncedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EmployeeDbResponse = z.infer<typeof employeeDbResponseSchema>;

