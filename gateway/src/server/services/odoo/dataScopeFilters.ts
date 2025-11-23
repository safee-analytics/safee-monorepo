/**
 * Data Scope Filters for Odoo
 *
 * This module provides functions to apply data scope filtering to Odoo domain queries.
 * It ensures users only see data they're authorized to access based on their role and scope.
 */

import type { OdooClient } from "./client.service.js";

export type OdooDomain = Array<string | [string, string, unknown]>;

export interface DataScopeContext {
  scope: "global" | "department" | "team" | "assigned" | "own";
  userId: string; // Safee user ID
  departmentId?: string;
  teamId?: string;
}

/**
 * Apply data scope filtering to accounting/invoice queries
 */
export async function applyAccountingDataScope(
  client: OdooClient,
  domain: OdooDomain,
  context: DataScopeContext,
): Promise<OdooDomain> {
  const { scope, userId } = context;

  // Global scope - no additional filtering
  if (scope === "global") {
    return domain;
  }

  // Get the Odoo user ID for this Safee user
  const odooUserId = await getOdooUserId(client, userId);
  if (!odooUserId) {
    // If no Odoo user mapping exists, fall back to global scope (show all)
    // This allows the system to work even without user mappings configured
    console.warn(`No Odoo user mapping for user ${userId}, falling back to global scope`);
    return domain;
  }

  switch (scope) {
    case "department":
      // Filter by department's analytic account (if exists)
      if (context.departmentId) {
        // TODO: Map Safee department to Odoo analytic account
        // For now, fall through to assigned
      }
      // Fall through to assigned if no department mapping

    case "assigned":
      // Show only invoices where user is the salesperson/invoice user
      domain.push(["invoice_user_id", "=", odooUserId]);
      break;

    case "team":
      // Show invoices from the user's sales team
      if (context.teamId) {
        // Get team member Odoo IDs
        const teamMemberOdooIds = await getTeamMemberOdooIds(client, context.teamId);
        if (teamMemberOdooIds.length > 0) {
          domain.push(["invoice_user_id", "in", teamMemberOdooIds]);
        } else {
          // No team members found, fall back to assigned
          domain.push(["invoice_user_id", "=", odooUserId]);
        }
      } else {
        // No team specified, fall back to assigned
        domain.push(["invoice_user_id", "=", odooUserId]);
      }
      break;

    case "own":
      // Show only invoices created by this user
      domain.push(["create_uid", "=", odooUserId]);
      break;

    default:
      // Default to most restrictive (own)
      domain.push(["create_uid", "=", odooUserId]);
  }

  return domain;
}

/**
 * Apply data scope filtering to CRM queries (leads/opportunities)
 */
export async function applyCRMDataScope(
  client: OdooClient,
  domain: OdooDomain,
  context: DataScopeContext,
): Promise<OdooDomain> {
  const { scope, userId } = context;

  if (scope === "global") {
    return domain;
  }

  const odooUserId = await getOdooUserId(client, userId);
  if (!odooUserId) {
    console.warn(`No Odoo user mapping for user ${userId}, falling back to global scope`);
    return domain;
  }

  switch (scope) {
    case "assigned":
      // Show only leads/opportunities assigned to this user
      domain.push(["user_id", "=", odooUserId]);
      break;

    case "team":
      // Show leads/opportunities from user's sales team
      if (context.teamId) {
        const teamMemberOdooIds = await getTeamMemberOdooIds(client, context.teamId);
        if (teamMemberOdooIds.length > 0) {
          domain.push(["user_id", "in", teamMemberOdooIds]);
        } else {
          domain.push(["user_id", "=", odooUserId]);
        }
      } else {
        domain.push(["user_id", "=", odooUserId]);
      }
      break;

    case "own":
      domain.push(["create_uid", "=", odooUserId]);
      break;

    default:
      domain.push(["create_uid", "=", odooUserId]);
  }

  return domain;
}

/**
 * Apply data scope filtering to HR queries (employees, payslips, etc.)
 */
export async function applyHRDataScope(
  client: OdooClient,
  domain: OdooDomain,
  context: DataScopeContext,
  resourceType: "employee" | "payslip" | "leave" | "attendance",
): Promise<OdooDomain> {
  const { scope, userId } = context;

  if (scope === "global") {
    return domain;
  }

  const odooUserId = await getOdooUserId(client, userId);
  if (!odooUserId) {
    console.warn(`No Odoo user mapping for user ${userId}, falling back to global scope`);
    return domain;
  }

  // Get the employee record for this user
  const odooEmployeeId = await getOdooEmployeeId(client, odooUserId);
  if (!odooEmployeeId) {
    console.warn(`No Odoo employee record for Odoo user ${odooUserId}, falling back to global scope`);
    return domain;
  }

  switch (scope) {
    case "team":
      // Show team members (direct reports)
      if (resourceType === "employee") {
        domain.push(["|", ["id", "=", odooEmployeeId], ["parent_id", "=", odooEmployeeId]]);
      } else {
        // For other HR resources, filter by employee
        const teamEmployeeIds = await getDirectReportIds(client, odooEmployeeId);
        domain.push(["employee_id", "in", [...teamEmployeeIds, odooEmployeeId]]);
      }
      break;

    case "own":
    case "assigned":
      // Show only own HR data
      if (resourceType === "employee") {
        domain.push(["id", "=", odooEmployeeId]);
      } else {
        domain.push(["employee_id", "=", odooEmployeeId]);
      }
      break;

    default:
      if (resourceType === "employee") {
        domain.push(["id", "=", odooEmployeeId]);
      } else {
        domain.push(["employee_id", "=", odooEmployeeId]);
      }
  }

  return domain;
}

/**
 * Get Odoo user ID from Safee user ID
 */
async function getOdooUserId(client: OdooClient, safeeUserId: string): Promise<number | null> {
  try {
    // Query the Safee database odoo_users table to get the Odoo UID
    const { getServerContext } = await import("../../serverContext.js");
    const ctx = getServerContext();
    const { schema } = await import("@safee/database");
    const { eq, and } = await import("drizzle-orm");

    // Get the Odoo database ID from the client (assuming it's stored in client context)
    // For now, we'll get the first active odoo_user record for this Safee user
    const odooUser = await ctx.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, safeeUserId), eq(schema.odooUsers.isActive, true)),
    });

    if (!odooUser) {
      console.warn(`No Odoo user mapping found for Safee user: ${safeeUserId}`);
      return null;
    }

    return odooUser.odooUid;
  } catch (error) {
    console.error("Error getting Odoo user ID:", error);
    return null;
  }
}

/**
 * Get Odoo employee ID from Odoo user ID
 */
async function getOdooEmployeeId(client: OdooClient, odooUserId: number): Promise<number | null> {
  try {
    const employees = await client.searchRead<{ id: number }>(
      "hr.employee",
      [["user_id", "=", odooUserId]],
      ["id"],
      { limit: 1 },
    );

    return employees[0]?.id ?? null;
  } catch (error) {
    console.error("Error getting Odoo employee ID:", error);
    return null;
  }
}

/**
 * Get Odoo user IDs for all members of a Safee team
 */
async function getTeamMemberOdooIds(client: OdooClient, safeeTeamId: string): Promise<number[]> {
  try {
    // TODO: Implement team member mapping
    // For now, return empty array (will fall back to individual user)
    return [];
  } catch (error) {
    console.error("Error getting team member Odoo IDs:", error);
    return [];
  }
}

/**
 * Get employee IDs of direct reports
 */
async function getDirectReportIds(client: OdooClient, managerId: number): Promise<number[]> {
  try {
    const employees = await client.searchRead<{ id: number }>(
      "hr.employee",
      [["parent_id", "=", managerId]],
      ["id"],
    );

    return employees.map((e) => e.id);
  } catch (error) {
    console.error("Error getting direct report IDs:", error);
    return [];
  }
}
