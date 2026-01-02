import { type DbDeps, schema, eq, and, inArray } from "@safee/database";

export class HierarchyService {
  constructor(private readonly deps: DbDeps) {}

  async getSubordinateUserIds(userId: string, organizationId: string): Promise<string[]> {
    const subordinateIds = new Set<string>();

    const directReports = await this.getDirectReports(userId, organizationId);
    for (const reportId of directReports) {
      subordinateIds.add(reportId);
    }

    const teamMemberIds = await this.getTeamMemberIds(userId, organizationId);
    for (const memberId of teamMemberIds) {
      subordinateIds.add(memberId);
    }

    const departmentMemberIds = await this.getDepartmentMemberIds(userId, organizationId);
    for (const memberId of departmentMemberIds) {
      subordinateIds.add(memberId);
    }

    return Array.from(subordinateIds);
  }

  private async getDirectReports(userId: string, organizationId: string): Promise<string[]> {
    const { drizzle } = this.deps;

    const managerEmployee = await drizzle.query.hrEmployees.findFirst({
      where: and(
        eq(schema.hrEmployees.userId, userId),
        eq(schema.hrEmployees.organizationId, organizationId),
      ),
    });

    if (!managerEmployee) {
      return [];
    }

    const directReports = await drizzle.query.hrEmployees.findMany({
      where: and(
        eq(schema.hrEmployees.managerId, managerEmployee.id),
        eq(schema.hrEmployees.organizationId, organizationId),
      ),
    });

    return directReports.map((employee) => employee.userId);
  }

  private async getTeamMemberIds(userId: string, organizationId: string): Promise<string[]> {
    const { drizzle } = this.deps;

    const userTeams = await drizzle.query.teamMembers.findMany({
      where: eq(schema.teamMembers.userId, userId),
      with: {
        team: true,
      },
    });

    const orgTeams = userTeams.filter((tm) => tm.team.organizationId === organizationId);

    if (orgTeams.length === 0) {
      return [];
    }

    const teamIds = orgTeams.map((tm) => tm.teamId);

    const allTeamMembers = await drizzle.query.teamMembers.findMany({
      where: inArray(schema.teamMembers.teamId, teamIds),
    });

    return allTeamMembers.filter((tm) => tm.userId !== userId).map((tm) => tm.userId);
  }

  private async getDepartmentMemberIds(userId: string, organizationId: string): Promise<string[]> {
    const { drizzle } = this.deps;

    const managerEmployee = await drizzle.query.hrEmployees.findFirst({
      where: and(
        eq(schema.hrEmployees.userId, userId),
        eq(schema.hrEmployees.organizationId, organizationId),
      ),
    });

    if (!managerEmployee?.departmentId) {
      return [];
    }

    const department = await drizzle.query.hrDepartments.findFirst({
      where: eq(schema.hrDepartments.id, managerEmployee.departmentId),
    });

    if (department?.managerId !== managerEmployee.id) {
      return [];
    }

    const departmentEmployees = await drizzle.query.hrEmployees.findMany({
      where: and(
        eq(schema.hrEmployees.departmentId, department.id),
        eq(schema.hrEmployees.organizationId, organizationId),
      ),
    });

    return departmentEmployees.filter((emp) => emp.userId !== userId).map((emp) => emp.userId);
  }

  async isManager(userId: string, organizationId: string): Promise<boolean> {
    const { drizzle } = this.deps;

    const member = await drizzle.query.members.findFirst({
      where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
    });

    return (
      (member?.role.includes("manager") ?? false) || member?.role === "owner" || member?.role === "admin"
    );
  }
}
