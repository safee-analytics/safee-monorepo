import { Controller, Post, Route, Tags, Body, Security, NoSecurity, SuccessResponse, Request } from "tsoa";
import type { Request as ExpressRequest } from "express";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { Unauthorized } from "../errors.js";
import {
  getUserByEmail,
  createUserWithOrganization,
  getUserRoleStrings,
  getUserPermissionStrings,
  sessionService,
} from "@safee/database";
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
      // Log login attempt (will be marked as success/failure later)
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

      // Create device fingerprint (simple version)
      const deviceFingerprint = `${userAgent}-${ipAddress}`.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 50);

      // Create user session
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
      throw new Error("Login failed");
    }
  }

  @Post("register")
  @NoSecurity()
  @SuccessResponse("201", "User registered successfully")
  public async register(@Body() request: RegisterRequest): Promise<LoginResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };

    try {
      // Validate password
      if (!passwordService.validatePassword(request.password)) {
        this.setStatus(400);
        throw new Error(
          "Password does not meet security requirements: " +
            passwordService.getPasswordRequirements().join(", "),
        );
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(request.password);

      // Create user with organization
      const result = await createUserWithOrganization(deps, {
        email: request.email,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        organizationName: request.organizationName,
      });

      // Get user roles and permissions for the new user
      const roles = await getUserRoleStrings(deps, result.user.id);
      const permissions = await getUserPermissionStrings(deps, result.user.id);

      // Generate tokens for the new user
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
      throw new Error("Registration failed");
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
      // Extract user info from JWT (this would be set by auth middleware)
      const userId = req.user?.userId;
      const sessionId = req.user?.sessionId;
      const organizationId = req.user?.organizationId;

      if (sessionId) {
        // Revoke the session
        await sessionService.revokeSession(deps, sessionId, "logout");

        // Log security event
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

      // Still return success for security - don't reveal internal errors
      return {
        message: "Logged out successfully",
      };
    }
  }
}
