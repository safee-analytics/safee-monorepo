import { Controller, Post, Route, Tags, Body, Security, NoSecurity, SuccessResponse, Request } from "tsoa";
import type { Request as ExpressRequest } from "express";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { Unauthorized, PasswordValidationFailed, OperationFailed } from "../errors.js";
import {
  getUserByEmail,
  getUserById,
  createUserWithOrganization,
  getUserRoleStrings,
  getUserPermissionStrings,
  sessionService,
  schema,
} from "@safee/database";
import { eq } from "drizzle-orm";
import { extractDeviceName } from "../utils/deviceUtils.js";
import { jwtService } from "../services/jwt.js";
import { passwordService } from "../services/password.js";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roles: string[];
    permissions: string[];
    organization?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface RequestPasswordResetRequest {
  email: string;
}

interface PasswordResetResponse {
  message: string;
}

@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
  private context: ServerContext;

  constructor(context?: ServerContext) {
    super();
    this.context = context ?? getServerContext();
  }
  @Post("login")
  @NoSecurity()
  @SuccessResponse("200", "Login successful")
  public async login(@Body() request: LoginRequest, @Request() req: ExpressRequest): Promise<LoginResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    try {
      await sessionService.logLoginAttempt(deps, {
        identifier: request.email,
        identifierType: "email",
        ipAddress,
        userAgent,
        success: false, // Will update this if successful
      });

      // Check rate limiting
      const recentFailedAttempts = await sessionService.getRecentFailedAttempts(deps, request.email);
      if (recentFailedAttempts >= 5) {
        await sessionService.logSecurityEvent(deps, {
          organizationId: "unknown",
          eventType: "account_locked",
          ipAddress,
          userAgent,
          success: false,
          riskLevel: "high",
          metadata: { reason: "too_many_failed_attempts", attempts: recentFailedAttempts },
        });
        throw new Unauthorized("Account temporarily locked due to too many failed attempts");
      }

      // Get user by email
      const user = await getUserByEmail(this.context, request.email);

      if (!user) {
        await sessionService.logLoginAttempt(deps, {
          identifier: request.email,
          identifierType: "email",
          ipAddress,
          userAgent,
          success: false,
          failureReason: "invalid_email",
        });
        throw new Unauthorized("Invalid email or password");
      }

      if (!user.isActive) {
        await sessionService.logLoginAttempt(deps, {
          identifier: request.email,
          identifierType: "email",
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "account_deactivated",
        });
        throw new Unauthorized("Account is deactivated");
      }

      // Verify password
      const isValidPassword = await passwordService.verifyPassword(request.password, user.passwordHash);

      if (!isValidPassword) {
        await sessionService.logLoginAttempt(deps, {
          identifier: request.email,
          identifierType: "email",
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "invalid_password",
        });
        throw new Unauthorized("Invalid email or password");
      }

      const deviceFingerprint = `${userAgent}-${ipAddress}`.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 50);

      const session = await sessionService.createSession(deps, {
        userId: user.id,
        deviceFingerprint,
        deviceName: extractDeviceName(userAgent),
        ipAddress,
        userAgent,
        loginMethod: "password",
        expiresIn: 24 * 60, // 24 hours
      });

      // Log successful login attempt
      await sessionService.logLoginAttempt(deps, {
        identifier: request.email,
        identifierType: "email",
        userId: user.id,
        ipAddress,
        userAgent,
        success: true,
      });

      // Log security event
      await sessionService.logSecurityEvent(deps, {
        userId: user.id,
        organizationId: user.organizationId,
        eventType: "login_success",
        ipAddress,
        userAgent,
        success: true,
        riskLevel: "low",
      });

      // Get user roles and permissions
      const roles = await getUserRoleStrings(this.context, user.id);
      const permissions = await getUserPermissionStrings(this.context, user.id);

      // Generate tokens (include sessionId in payload)
      const tokenPayload = {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        sessionId: session.id,
        roles,
        permissions,
      };

      const tokens = await jwtService.generateTokenPair(tokenPayload);

      this.context.logger.info(
        {
          userId: user.id,
          email: user.email,
          sessionId: session.id,
          deviceFingerprint,
        },
        "User logged in successfully",
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          permissions,
          organization: user.organization,
        },
      };
    } catch (error) {
      this.context.logger.error({ error, email: request.email, ipAddress }, "Login failed");

      if (error instanceof Error && error.message.includes("Invalid")) {
        this.setStatus(401);
        throw error;
      }

      if (error instanceof Error && error.message.includes("locked")) {
        this.setStatus(429);
        throw error;
      }

      this.setStatus(500);
      throw new OperationFailed("Login");
    }
  }

  @Post("register")
  @NoSecurity()
  @SuccessResponse("201", "User registered successfully")
  public async register(@Body() request: RegisterRequest): Promise<LoginResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };

    try {
      if (!passwordService.validatePassword(request.password)) {
        throw new PasswordValidationFailed();
      }

      const passwordHash = await passwordService.hashPassword(request.password);

      const result = await createUserWithOrganization(deps, {
        email: request.email,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        organizationName: request.organizationName,
      });

      const roles = await getUserRoleStrings(deps, result.user.id);
      const permissions = await getUserPermissionStrings(deps, result.user.id);

      const tokenPayload = {
        userId: result.user.id,
        organizationId: result.user.organizationId,
        email: result.user.email,
        roles,
        permissions,
      };

      const tokens = await jwtService.generateTokenPair(tokenPayload);

      this.setStatus(201);

      this.context.logger.info(
        {
          userId: result.user.id,
          organizationId: result.organization.id,
          email: result.user.email,
        },
        "User registered successfully",
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        sessionId: "registration-session", // For consistency, though registration doesn't create a full session
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          roles,
          permissions,
          organization: {
            id: result.organization.id,
            name: result.organization.name,
            slug: result.organization.slug,
          },
        },
      };
    } catch (error) {
      this.context.logger.error({ error, email: request.email }, "Registration failed");

      if (error instanceof Error) {
        if (error.message.includes("already exists")) {
          this.setStatus(409);
          throw error;
        }
        if (error.message.includes("Password does not meet")) {
          this.setStatus(400);
          throw error;
        }
      }

      this.setStatus(500);
      throw new OperationFailed("Registration");
    }
  }

  @Post("logout")
  @Security("jwt")
  @SuccessResponse("200", "Logout successful")
  public async logout(@Request() req: ExpressRequest): Promise<{ message: string }> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    try {
      const userId = req.user?.userId;
      const sessionId = req.user?.sessionId;
      const organizationId = req.user?.organizationId;

      if (sessionId) {
        await sessionService.revokeSession(deps, sessionId, "logout");

        if (userId && organizationId) {
          await sessionService.logSecurityEvent(deps, {
            userId,
            organizationId,
            eventType: "logout",
            ipAddress,
            userAgent,
            success: true,
            riskLevel: "low",
          });
        }

        this.context.logger.info({ userId, sessionId }, "User logged out successfully");
      } else {
        this.context.logger.warn("Logout attempted without valid session");
      }

      return {
        message: "Logged out successfully",
      };
    } catch (error) {
      this.context.logger.error({ error }, "Logout failed");

      return {
        message: "Logged out successfully",
      };
    }
  }

  @Post("change-password")
  @Security("jwt")
  @SuccessResponse("200", "Password changed successfully")
  public async changePassword(
    @Body() request: ChangePasswordRequest,
    @Request() req: ExpressRequest,
  ): Promise<PasswordResetResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.user?.userId;
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const user = await getUserById(deps, userId);
      if (!user) {
        throw new Unauthorized("User not found");
      }

      const isValidPassword = await passwordService.verifyPassword(
        request.currentPassword,
        user.passwordHash,
      );
      if (!isValidPassword) {
        await sessionService.logSecurityEvent(deps, {
          userId,
          organizationId: user.organizationId,
          eventType: "password_change_failed",
          ipAddress,
          userAgent,
          success: false,
          riskLevel: "medium",
          metadata: { reason: "invalid_current_password" },
        });
        throw new Unauthorized("Current password is incorrect");
      }

      if (!passwordService.validatePassword(request.newPassword)) {
        throw new PasswordValidationFailed();
      }

      const newPasswordHash = await passwordService.hashPassword(request.newPassword);

      await deps.drizzle
        .update(schema.users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));

      await sessionService.logSecurityEvent(deps, {
        userId,
        organizationId: user.organizationId,
        eventType: "password_changed",
        ipAddress,
        userAgent,
        success: true,
        riskLevel: "low",
      });

      this.context.logger.info({ userId }, "Password changed successfully");

      return {
        message: "Password changed successfully",
      };
    } catch (error) {
      this.context.logger.error({ error, userId }, "Failed to change password");
      throw error;
    }
  }

  @Post("request-password-reset")
  @NoSecurity()
  @SuccessResponse("200", "Password reset email sent (if account exists)")
  public async requestPasswordReset(
    @Body() request: RequestPasswordResetRequest,
    @Request() req: ExpressRequest,
  ): Promise<PasswordResetResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    try {
      const user = await getUserByEmail(this.context, request.email);

      if (user) {
        // TODO: Generate reset token and send email
        // For now, just log the request
        await sessionService.logSecurityEvent(deps, {
          userId: user.id,
          organizationId: user.organizationId,
          eventType: "password_reset_requested",
          ipAddress,
          userAgent,
          success: true,
          riskLevel: "low",
          metadata: { email: request.email },
        });

        this.context.logger.info(
          { userId: user.id, email: request.email },
          "Password reset requested - email functionality not yet implemented",
        );
      } else {
        this.context.logger.warn(
          { email: request.email, ipAddress },
          "Password reset requested for non-existent user",
        );
      }

      return {
        message:
          "If an account exists with this email, a password reset link will be sent. (Email functionality coming soon)",
      };
    } catch (error) {
      this.context.logger.error({ error, email: request.email }, "Failed to process password reset request");

      return {
        message:
          "If an account exists with this email, a password reset link will be sent. (Email functionality coming soon)",
      };
    }
  }
}
