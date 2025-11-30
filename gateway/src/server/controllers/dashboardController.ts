import { Controller, Get, Post, Route, Tags, Security, Request, Path, Query } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getCaseStats,
  getRecentCaseActivity,
  getRecentNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
} from "@safee/database";
import { getServerContext } from "../serverContext.js";

/**
 * Dashboard statistics response
 */
export interface DashboardStatsResponse {
  activeCases: number;
  pendingReviews: number;
  completedAudits: number;
  totalCases: number;
  completionRate: number;
}

/**
 * Case activity item
 */
export interface RecentCaseUpdateResponse {
  id: string;
  type: "case_update";
  caseId: string;
  caseNumber: string;
  clientName: string;
  status: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

/**
 * Notification response
 */
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
}

/**
 * Unread notifications count response
 */
export interface UnreadNotificationsCountResponse {
  count: number;
}

@Route("dashboard")
@Tags("Dashboard")
export class DashboardController extends Controller {
  /**
   * Get dashboard statistics
   * Returns aggregate statistics for the organization's cases
   */
  @Get("/stats")
  @Security("jwt")
  public async getStats(@Request() req: AuthenticatedRequest): Promise<DashboardStatsResponse> {
    const { drizzle, logger } = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId;

    if (!organizationId) {
      throw new Error("No active organization");
    }

    const stats = await getCaseStats({ drizzle, logger }, organizationId);

    return stats;
  }

  /**
   * Get recent case activity
   * Returns the most recent case updates for the organization
   */
  @Get("/activity")
  @Security("jwt")
  public async getActivity(
    @Request() req: AuthenticatedRequest,
    @Query() limit?: number,
  ): Promise<RecentCaseUpdateResponse[]> {
    const { drizzle, logger } = getServerContext();
    const organizationId = req.betterAuthSession?.session.activeOrganizationId;

    if (!organizationId) {
      throw new Error("No active organization");
    }

    const activity = await getRecentCaseActivity({ drizzle, logger }, organizationId, limit ?? 10);

    return activity;
  }

  /**
   * Get recent notifications for the current user
   * Returns the most recent notifications for the authenticated user
   */
  @Get("/notifications")
  @Security("jwt")
  public async getNotifications(
    @Request() req: AuthenticatedRequest,
    @Query() limit?: number,
  ): Promise<NotificationResponse[]> {
    const { drizzle, logger } = getServerContext();
    const userId = req.betterAuthSession?.user.id;
    const organizationId = req.betterAuthSession?.session.activeOrganizationId;

    if (!userId || !organizationId) {
      throw new Error("No active user or organization");
    }

    const notifications = await getRecentNotifications(
      { drizzle, logger },
      userId,
      organizationId,
      limit ?? 10,
    );

    return notifications;
  }

  /**
   * Get unread notifications count
   * Returns the count of unread notifications for the authenticated user
   */
  @Get("/notifications/unread-count")
  @Security("jwt")
  public async getUnreadNotificationsCount(
    @Request() req: AuthenticatedRequest,
  ): Promise<UnreadNotificationsCountResponse> {
    const { drizzle, logger } = getServerContext();
    const userId = req.betterAuthSession?.user.id;
    const organizationId = req.betterAuthSession?.session.activeOrganizationId;

    if (!userId || !organizationId) {
      throw new Error("No active user or organization");
    }

    const count = await getUnreadNotificationsCount({ drizzle, logger }, userId, organizationId);

    return { count };
  }

  /**
   * Mark a notification as read
   * Marks a specific notification as read for the authenticated user
   */
  @Post("/notifications/{notificationId}/read")
  @Security("jwt")
  public async markNotificationAsRead(
    @Request() req: AuthenticatedRequest,
    @Path() notificationId: string,
  ): Promise<{ success: boolean }> {
    const { drizzle, logger } = getServerContext();
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Error("No active user");
    }

    await markNotificationAsRead({ drizzle, logger }, notificationId, userId);

    return { success: true };
  }
}
