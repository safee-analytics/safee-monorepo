import { eq, and, sum } from "drizzle-orm";
import { hrLeaveAllocations, hrLeaveRequests, hrLeaveTypes } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { LeaveBalance } from "./types.js";

export async function getLeaveBalanceByEmployee(
  deps: DbDeps,
  employeeId: string,
  organizationId: string,
): Promise<LeaveBalance[]> {
  const leaveTypes = await deps.drizzle.query.hrLeaveTypes.findMany({
    where: eq(hrLeaveTypes.organizationId, organizationId),
  });

  const balances: LeaveBalance[] = [];

  for (const leaveType of leaveTypes) {
    const allocations = await deps.drizzle
      .select({
        total: sum(hrLeaveAllocations.numberOfDays),
      })
      .from(hrLeaveAllocations)
      .where(
        and(eq(hrLeaveAllocations.employeeId, employeeId), eq(hrLeaveAllocations.leaveTypeId, leaveType.id)),
      );

    const totalAllocated = Number(allocations[0]?.total ?? 0);

    const usedLeaves = await deps.drizzle
      .select({
        total: sum(hrLeaveRequests.numberOfDays),
      })
      .from(hrLeaveRequests)
      .where(
        and(
          eq(hrLeaveRequests.employeeId, employeeId),
          eq(hrLeaveRequests.leaveTypeId, leaveType.id),
          eq(hrLeaveRequests.state, "validate"),
        ),
      );

    const totalUsed = Number(usedLeaves[0]?.total ?? 0);

    balances.push({
      employeeId,
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      totalAllocated,
      totalUsed,
      totalRemaining: totalAllocated - totalUsed,
    });
  }

  return balances;
}

export async function getLeaveBalanceByLeaveType(
  deps: DbDeps,
  employeeId: string,
  leaveTypeId: string,
): Promise<LeaveBalance | null> {
  const leaveType = await deps.drizzle.query.hrLeaveTypes.findFirst({
    where: eq(hrLeaveTypes.id, leaveTypeId),
  });

  if (!leaveType) {
    return null;
  }

  const allocations = await deps.drizzle
    .select({
      total: sum(hrLeaveAllocations.numberOfDays),
    })
    .from(hrLeaveAllocations)
    .where(
      and(eq(hrLeaveAllocations.employeeId, employeeId), eq(hrLeaveAllocations.leaveTypeId, leaveTypeId)),
    );

  const totalAllocated = Number(allocations[0]?.total ?? 0);

  const usedLeaves = await deps.drizzle
    .select({
      total: sum(hrLeaveRequests.numberOfDays),
    })
    .from(hrLeaveRequests)
    .where(
      and(
        eq(hrLeaveRequests.employeeId, employeeId),
        eq(hrLeaveRequests.leaveTypeId, leaveTypeId),
        eq(hrLeaveRequests.state, "validate"),
      ),
    );

  const totalUsed = Number(usedLeaves[0]?.total ?? 0);

  return {
    employeeId,
    leaveTypeId,
    leaveTypeName: leaveType.name,
    totalAllocated,
    totalUsed,
    totalRemaining: totalAllocated - totalUsed,
  };
}
