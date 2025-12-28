import { type DbDeps, schema, eq, and, isNull } from "@safee/database";
import type { HRSectionResponse, ModuleAccessRule } from "../dtos/moduleAccess.js";
import { roleHierarchy } from "../../auth/accessControl.js";
import { ALL_MODULES } from "../constants/modules.js";

const HR_ROLES: ReadonlySet<string> = new Set(["hr_manager", "hr_coordinator"]);

function isHRRole(role: string): boolean {
  return HR_ROLES.has(role);
}

export class ModuleAccessService {
  constructor(private readonly deps: DbDeps) {}

  async getAccessibleModules(userId: string, organizationId: string): Promise<string[]> {
    const { drizzle, logger } = this.deps;

    try {
      const member = await drizzle.query.members.findFirst({
        where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
      });

      if (!member) {
        logger.warn({ userId, organizationId }, "User is not a member of organization");
        return [];
      }

      const role = member.role;

      if (role === "owner" || role === "admin") {
        return [...ALL_MODULES];
      }

      return await this.checkModuleAccessRules(role, organizationId);
    } catch (err) {
      logger.error({ error: err, userId, organizationId }, "Failed to get accessible modules");
      throw err;
    }
  }

  async canAccessModule(userId: string, organizationId: string, moduleKey: string): Promise<boolean> {
    return (await this.getAccessibleModules(userId, organizationId)).includes(moduleKey);
  }

  async getAccessibleHRSections(userId: string, organizationId: string): Promise<HRSectionResponse[]> {
    const { drizzle, logger } = this.deps;

    try {
      const member = await drizzle.query.members.findFirst({
        where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
      });

      if (!member) {
        logger.warn({ userId, organizationId }, "User is not a member of organization");
        return [];
      }

      const role = member.role;

      const allSections = await drizzle.query.hrModuleSections.findMany({
        where: eq(schema.hrModuleSections.isActive, true),
        orderBy: (sections, { asc }) => [asc(sections.sortOrder)],
      });

      const userRoleLevel = roleHierarchy[role] ?? 999;

      const accessibleSections = allSections.filter((section) => {
        if (section.sectionType === "self_service") {
          return true;
        }

        if (role === "owner" || role === "admin") {
          return true;
        }

        if (section.minimumRole) {
          const requiredLevel = roleHierarchy[section.minimumRole] ?? 0;
          return userRoleLevel <= requiredLevel;
        }

        return isHRRole(role);
      });

      return accessibleSections;
    } catch (err) {
      logger.error({ error: err, userId, organizationId }, "Failed to get accessible HR sections");
      throw err;
    }
  }

  async updateModuleAccessRules(organizationId: string | null, rules: ModuleAccessRule[]): Promise<void> {
    const { drizzle, logger } = this.deps;

    try {
      if (organizationId) {
        await drizzle
          .delete(schema.moduleAccessRules)
          .where(eq(schema.moduleAccessRules.organizationId, organizationId));
      }

      if (rules.length > 0) {
        await drizzle.insert(schema.moduleAccessRules).values(
          rules.map((rule) => ({
            organizationId,
            moduleKey: rule.moduleKey,
            role: rule.role,
            hasAccess: rule.hasAccess,
          })),
        );
      }

      logger.info({ organizationId, rulesCount: rules.length }, "Updated module access rules");
    } catch (err) {
      logger.error({ error: err, organizationId }, "Failed to update module access rules");
      throw err;
    }
  }

  private async checkModuleAccessRules(role: string, organizationId: string): Promise<string[]> {
    const { drizzle } = this.deps;

    const orgRules = await drizzle.query.moduleAccessRules.findMany({
      where: and(
        eq(schema.moduleAccessRules.organizationId, organizationId),
        eq(schema.moduleAccessRules.role, role),
        eq(schema.moduleAccessRules.hasAccess, true),
      ),
    });

    if (orgRules.length > 0) {
      return orgRules.map((rule) => rule.moduleKey);
    }

    const globalRules = await drizzle.query.moduleAccessRules.findMany({
      where: and(
        isNull(schema.moduleAccessRules.organizationId),
        eq(schema.moduleAccessRules.role, role),
        eq(schema.moduleAccessRules.hasAccess, true),
      ),
    });

    return globalRules.map((rule) => rule.moduleKey);
  }
}
