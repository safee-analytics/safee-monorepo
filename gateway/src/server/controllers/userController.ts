import { Controller, Get, Put, Route, Tags, Security, Body, SuccessResponse, Request } from "tsoa";
import type { Request as ExpressRequest } from "express";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { getUserById, updateUserProfile, updateUserLocale } from "@safee/database";
import { Unauthorized } from "../errors.js";

type Locale = "en" | "ar";

interface UserProfileResponse {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  preferredLocale: Locale;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  preferredLocale?: Locale;
}

interface UpdateLocaleRequest {
  locale: Locale;
}

@Route("users")
@Tags("Users")
export class UserController extends Controller {
  private context: ServerContext;

  constructor(context?: ServerContext) {
    super();
    this.context = context ?? getServerContext();
  }

  @Get("me")
  @Security("jwt")
  @SuccessResponse("200", "User profile retrieved")
  public async getCurrentUser(@Request() req: ExpressRequest): Promise<UserProfileResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.user?.userId;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const user = await getUserById(deps, userId);

      if (!user) {
        this.setStatus(404);
        throw new Error("User not found");
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredLocale: user.preferredLocale,
        organizationId: user.organizationId,
        organization: user.organization,
      };
    } catch (error) {
      this.context.logger.error({ error, userId }, "Failed to get current user");
      throw error;
    }
  }

  @Put("me")
  @Security("jwt")
  @SuccessResponse("200", "User profile updated")
  public async updateCurrentUser(
    @Body() request: UpdateProfileRequest,
    @Request() req: ExpressRequest,
  ): Promise<UserProfileResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.user?.userId;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const updatedUser = await updateUserProfile(deps, userId, request);

      const user = await getUserById(deps, userId);

      if (!user) {
        this.setStatus(404);
        throw new Error("User not found");
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        preferredLocale: updatedUser.preferredLocale,
        organizationId: updatedUser.organizationId,
        organization: user.organization,
      };
    } catch (error) {
      this.context.logger.error({ error, userId, request }, "Failed to update user profile");
      throw error;
    }
  }

  @Put("me/locale")
  @Security("jwt")
  @SuccessResponse("200", "User locale updated")
  public async updateCurrentUserLocale(
    @Body() request: UpdateLocaleRequest,
    @Request() req: ExpressRequest,
  ): Promise<{ message: string; locale: Locale }> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.user?.userId;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      await updateUserLocale(deps, userId, request.locale);

      return {
        message: "Locale updated successfully",
        locale: request.locale,
      };
    } catch (error) {
      this.context.logger.error({ error, userId, locale: request.locale }, "Failed to update user locale");
      throw error;
    }
  }
}
