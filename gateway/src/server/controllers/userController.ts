import { Controller, Get, Put, Route, Tags, Security, Body, SuccessResponse, Request } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { getUserById, updateUserProfile, updateUserLocale, UserNotFoundError } from "@safee/database";
import { Unauthorized, UserNotFound } from "../errors.js";

type Locale = "en" | "ar";

interface UserProfileResponse {
  id: string;
  email: string;
  name?: string | null;
  preferredLocale: Locale;
  organizationId: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UpdateProfileRequest {
  name?: string;
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
  public async getCurrentUser(@Request() req: AuthenticatedRequest): Promise<UserProfileResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const user = await getUserById(deps, userId);

      if (!user) {
        throw new UserNotFound();
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        preferredLocale: user.preferredLocale,
        organizationId: user.organizationId,
        organization: user.organization,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new UserNotFound();
      }
      this.context.logger.error({ error, userId }, "Failed to get current user");
      throw error;
    }
  }

  @Put("me")
  @Security("jwt")
  @SuccessResponse("200", "User profile updated")
  public async updateCurrentUser(
    @Body() request: UpdateProfileRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const updatedUser = await updateUserProfile(deps, userId, request);

      const user = await getUserById(deps, userId);

      if (!user) {
        throw new UserNotFound();
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        preferredLocale: updatedUser.preferredLocale,
        organizationId: updatedUser.organizationId,
        organization: user.organization,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new UserNotFound();
      }
      this.context.logger.error({ error, userId, request }, "Failed to update user profile");
      throw error;
    }
  }

  @Put("me/locale")
  @Security("jwt")
  @SuccessResponse("200", "User locale updated")
  public async updateCurrentUserLocale(
    @Body() request: UpdateLocaleRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string; locale: Locale }> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.betterAuthSession?.user.id;

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
      if (error instanceof UserNotFoundError) {
        throw new UserNotFound();
      }
      this.context.logger.error({ error, userId, locale: request.locale }, "Failed to update user locale");
      throw error;
    }
  }
}
