import { eq, and, desc } from "drizzle-orm";
import { hrDepartments } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from "./types.js";

export async function createDepartment(deps: DbDeps, input: CreateDepartmentInput): Promise<Department> {
  const [department] = await deps.drizzle.insert(hrDepartments).values(input).returning();
  return department;
}

export async function getDepartmentById(deps: DbDeps, departmentId: string): Promise<Department | undefined> {
  return deps.drizzle.query.hrDepartments.findFirst({
    where: eq(hrDepartments.id, departmentId),
  });
}

export async function getDepartmentByOdooId(
  deps: DbDeps,
  odooDepartmentId: number,
  organizationId: string,
): Promise<Department | undefined> {
  return deps.drizzle.query.hrDepartments.findFirst({
    where: and(
      eq(hrDepartments.odooDepartmentId, odooDepartmentId),
      eq(hrDepartments.organizationId, organizationId),
    ),
  });
}

export async function getDepartmentsByOrganization(
  deps: DbDeps,
  organizationId: string,
): Promise<Department[]> {
  return deps.drizzle.query.hrDepartments.findMany({
    where: eq(hrDepartments.organizationId, organizationId),
    orderBy: [desc(hrDepartments.createdAt)],
  });
}

export async function getSubDepartments(deps: DbDeps, parentDepartmentId: string): Promise<Department[]> {
  return deps.drizzle.query.hrDepartments.findMany({
    where: eq(hrDepartments.parentId, parentDepartmentId),
    orderBy: [desc(hrDepartments.createdAt)],
  });
}

export async function updateDepartment(
  deps: DbDeps,
  departmentId: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  const [updated] = await deps.drizzle
    .update(hrDepartments)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(hrDepartments.id, departmentId))
    .returning();
  return updated;
}

export async function deleteDepartment(deps: DbDeps, departmentId: string): Promise<void> {
  await deps.drizzle.delete(hrDepartments).where(eq(hrDepartments.id, departmentId));
}

export async function syncDepartment(
  deps: DbDeps,
  departmentData: CreateDepartmentInput,
): Promise<Department> {
  const existing = departmentData.odooDepartmentId
    ? await getDepartmentByOdooId(deps, departmentData.odooDepartmentId, departmentData.organizationId)
    : undefined;

  if (existing) {
    return updateDepartment(deps, existing.id, {
      ...departmentData,
      lastSyncedAt: new Date(),
    });
  }
  return createDepartment(deps, {
    ...departmentData,
    lastSyncedAt: new Date(),
  });
}
