import { Controller, Get, Post, Route, Tags, Security, Query, Path, Body, Request } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getOrganizationAuditLogs,
  getUserActivityLogs,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
} from "@safee/database";
import type { EntityType } from "../services/approval-rules-engine.js";

type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "failed"
  | "started"
  | "cancelled"
  | "retrying";

interface AuditLogFilters {
  entityType?: EntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface AuditLogUser {
  id: string;
  name: string | null;
  email: string;
}

interface AuditLogResponse {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  organizationId: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: AuditLogUser | null;
}

interface ExportAuditLogsRequest {
  format: "csv" | "json";
  filters?: AuditLogFilters;
}

@Route("organizations/{orgId}/audit-logs")
@Tags("Audit Logs")
@Security("jwt")
export class OrganizationAuditLogsController extends Controller {
  /**
   * Get audit logs for an organization with optional filtering
   */
  @Get()
  @Security("jwt")
  public async getOrganizationAuditLogs(
    @Path() orgId: string,
    @Query() entityType?: EntityType,
    @Query() entityId?: string,
    @Query() action?: AuditAction,
    @Query() userId?: string,
    @Query() startDate?: string,
    @Query() endDate?: string,
    @Query() limit?: number,
    @Query() offset?: number,
    @Request() request?: AuthenticatedRequest,
  ): Promise<{ logs: AuditLogResponse[]; total: number }> {
    const filters: AuditLogFilters = {
      entityType,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      limit,
      offset,
    };

    return await getOrganizationAuditLogs(request!.drizzle, orgId, filters);
  }

  /**
   * Export audit logs to CSV or JSON
   */
  @Post("export")
  @Security("jwt")
  public async exportAuditLogs(
    @Path() orgId: string,
    @Body() body: ExportAuditLogsRequest,
    @Request() request?: AuthenticatedRequest,
  ): Promise<{ data: string; filename: string; contentType: string }> {
    const { logs } = await getOrganizationAuditLogs(request!.drizzle, orgId, body.filters ?? {});

    const format = body.format;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `audit-logs-${orgId}-${timestamp}.${format}`;

    let data: string;
    let contentType: string;

    if (format === "csv") {
      data = exportAuditLogsToCSV(logs);
      contentType = "text/csv";
    } else {
      data = exportAuditLogsToJSON(logs);
      contentType = "application/json";
    }

    return { data, filename, contentType };
  }
}

@Route("users/{userId}/activity-logs")
@Tags("Audit Logs")
@Security("jwt")
export class UserActivityLogsController extends Controller {
  /**
   * Get activity logs for a specific user
   */
  @Get()
  @Security("jwt")
  public async getUserActivityLogs(
    @Path() userId: string,
    @Query() entityType?: EntityType,
    @Query() action?: AuditAction,
    @Query() startDate?: string,
    @Query() endDate?: string,
    @Query() limit?: number,
    @Query() offset?: number,
    @Request() request?: AuthenticatedRequest,
  ): Promise<{ logs: AuditLogResponse[]; total: number }> {
    const filters: AuditLogFilters = {
      entityType,
      action,
      startDate,
      endDate,
      limit,
      offset,
    };

    return await getUserActivityLogs(request!.drizzle, userId, filters);
  }
}
