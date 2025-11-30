import { Controller, Get, Post, Route, Tags, Security, Body, Path, Request, Query } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type {
  CaseActivityResponse,
  CreateCaseActivityRequest,
  PresenceResponse,
  UpdatePresenceRequest,
  MarkAsReadRequest,
} from "../dtos/collaboration.js";
import {
  getActivitiesByCase,
  createActivity,
  markActivitiesAsRead,
  updatePresence,
  getActiveViewers,
} from "@safee/database";

@Route("collaboration")
@Tags("Collaboration")
export class CollaborationController extends Controller {
  @Get("/activities/case/{caseId}")
  @Security("jwt")
  public async getActivitiesByCase(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Query() limit?: number,
  ): Promise<CaseActivityResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const activities = await getActivitiesByCase(deps, caseId, limit);

    return activities.map((a) => ({
      id: a.id,
      caseId: a.caseId,
      activityType: a.activityType,
      userId: a.userId ?? undefined,
      user: a.user
        ? {
            id: a.user.id,
            name: a.user.name,
            email: a.user.email,
          }
        : undefined,
      metadata: a.metadata,
      isRead: a.isRead,
      createdAt: a.createdAt,
    }));
  }

  @Post("/activities")
  @Security("jwt")
  public async createActivity(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateCaseActivityRequest,
  ): Promise<CaseActivityResponse> {
    const userId = req.betterAuthSession?.user.id || "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const activity = await createActivity(deps, {
      caseId: request.caseId,
      activityType: request.activityType,
      userId,
      metadata: request.metadata,
    });

    return {
      id: activity.id,
      caseId: activity.caseId,
      activityType: activity.activityType,
      userId: activity.userId ?? undefined,
      metadata: activity.metadata,
      isRead: activity.isRead,
      createdAt: activity.createdAt,
    };
  }

  @Post("/activities/mark-read")
  @Security("jwt")
  public async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Body() request: MarkAsReadRequest,
  ): Promise<{ success: boolean }> {
    const userId = req.betterAuthSession?.user.id || "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    await markActivitiesAsRead(deps, userId, request.activityIds);

    return { success: true };
  }

  @Post("/presence")
  @Security("jwt")
  public async updatePresence(
    @Request() req: AuthenticatedRequest,
    @Body() request: UpdatePresenceRequest,
  ): Promise<PresenceResponse> {
    const userId = req.betterAuthSession?.user.id || "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const presence = await updatePresence(deps, {
      caseId: request.caseId,
      userId,
    });

    return {
      id: presence.id,
      caseId: presence.caseId,
      userId: presence.userId,
      lastSeenAt: presence.lastSeenAt,
    };
  }

  @Get("/presence/case/{caseId}")
  @Security("jwt")
  public async getActiveViewers(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<PresenceResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const viewers = await getActiveViewers(deps, caseId);

    return viewers.map((v) => ({
      id: v.id,
      caseId: v.caseId,
      userId: v.userId,
      user: v.user
        ? {
            id: v.user.id,
            name: v.user.name,
            email: v.user.email,
          }
        : undefined,
      lastSeenAt: v.lastSeenAt,
    }));
  }
}
