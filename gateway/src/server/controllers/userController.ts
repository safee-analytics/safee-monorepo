import { Controller, Get, Put, Route, Tags, Security, Body, SuccessResponse, Request, UploadedFile } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { getUserById, updateUserProfile, updateUserLocale, updateUserImage, UserNotFoundError } from "@safee/database";
import { Unauthorized, UserNotFound } from "../errors.js";
import { StorageServiceV2 } from "../services/storage.service.v2.js";
import { StorageConnectorService } from "../services/storage/storage-connector.service.js";

type Locale = "en" | "ar";

interface UserProfileResponse {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  preferredLocale: Locale;
  activeOrganizationId?: string | null;
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
        image: user.image,
        preferredLocale: user.preferredLocale,
        activeOrganizationId: req.betterAuthSession?.session.activeOrganizationId,
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
        image: updatedUser.image,
        preferredLocale: updatedUser.preferredLocale,
        activeOrganizationId: req.betterAuthSession?.session.activeOrganizationId,
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

  @Put("me/avatar")
  @Security("jwt")
  @SuccessResponse("200", "User avatar updated")
  public async updateAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: globalThis.Express.Multer.File,
  ): Promise<UserProfileResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.betterAuthSession?.user.id;
    const orgId = req.betterAuthSession?.session.activeOrganizationId;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    if (!orgId) {
      throw new Unauthorized("No active organization");
    }

    try {
      // Get storage service for organization
      const connectorService = new StorageConnectorService(this.context.drizzle);
      const adapter = await connectorService.getAdapter(orgId);
      const storageService = new StorageServiceV2(adapter);

      // Upload file to storage
      const metadata = await storageService.uploadFile(file, {
        folderId: `users/${userId}/avatar`,
        tags: ['avatar'],
        userId,
      });

      // Update user record with file path
      const updatedUser = await updateUserImage(deps, userId, metadata.path);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        preferredLocale: updatedUser.preferredLocale,
        activeOrganizationId: orgId,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new UserNotFound();
      }
      this.context.logger.error({ error, userId }, "Failed to update user avatar");
      throw error;
    }
  }
}
