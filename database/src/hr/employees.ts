import { eq, and, desc } from "drizzle-orm";
import { hrEmployees } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from "./types.js";

export async function createEmployee(deps: DbDeps, input: CreateEmployeeInput): Promise<Employee> {
  const [employee] = await deps.drizzle.insert(hrEmployees).values(input).returning();
  return employee;
}

export async function getEmployeeById(deps: DbDeps, employeeId: string): Promise<Employee | undefined> {
  return deps.drizzle.query.hrEmployees.findFirst({
    where: eq(hrEmployees.id, employeeId),
  });
}

export async function getEmployeeByOdooId(
  deps: DbDeps,
  odooEmployeeId: number,
  organizationId: string,
): Promise<Employee | undefined> {
  return deps.drizzle.query.hrEmployees.findFirst({
    where: and(
      eq(hrEmployees.odooEmployeeId, odooEmployeeId),
      eq(hrEmployees.organizationId, organizationId),
    ),
  });
}

export async function getEmployeeByUserId(deps: DbDeps, userId: string): Promise<Employee | undefined> {
  return deps.drizzle.query.hrEmployees.findFirst({
    where: eq(hrEmployees.userId, userId),
  });
}

export async function getEmployeesByOrganization(deps: DbDeps, organizationId: string): Promise<Employee[]> {
  return deps.drizzle.query.hrEmployees.findMany({
    where: and(eq(hrEmployees.organizationId, organizationId), eq(hrEmployees.active, true)),
    orderBy: [desc(hrEmployees.createdAt)],
  });
}

export async function getEmployeesByDepartment(deps: DbDeps, departmentId: string): Promise<Employee[]> {
  return deps.drizzle.query.hrEmployees.findMany({
    where: and(eq(hrEmployees.departmentId, departmentId), eq(hrEmployees.active, true)),
    orderBy: [desc(hrEmployees.createdAt)],
  });
}

export async function getEmployeesByManager(deps: DbDeps, managerId: string): Promise<Employee[]> {
  return deps.drizzle.query.hrEmployees.findMany({
    where: and(eq(hrEmployees.managerId, managerId), eq(hrEmployees.active, true)),
    orderBy: [desc(hrEmployees.createdAt)],
  });
}

export async function updateEmployee(
  deps: DbDeps,
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<Employee> {
  const [updated] = await deps.drizzle
    .update(hrEmployees)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(hrEmployees.id, employeeId))
    .returning();
  return updated;
}

export async function deactivateEmployee(deps: DbDeps, employeeId: string): Promise<Employee> {
  const [deactivated] = await deps.drizzle
    .update(hrEmployees)
    .set({
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(hrEmployees.id, employeeId))
    .returning();
  return deactivated;
}

export async function syncEmployee(deps: DbDeps, employeeData: CreateEmployeeInput): Promise<Employee> {
  const existing = employeeData.odooEmployeeId
    ? await getEmployeeByOdooId(deps, employeeData.odooEmployeeId, employeeData.organizationId)
    : undefined;

  if (existing) {
    return updateEmployee(deps, existing.id, {
      ...employeeData,
      lastSyncedAt: new Date(),
    });
  }
  return createEmployee(deps, {
    ...employeeData,
    lastSyncedAt: new Date(),
  });
}
