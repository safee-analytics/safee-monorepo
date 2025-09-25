import { Controller, Post, Route, Tags, Body, Security, NoSecurity, SuccessResponse } from "tsoa";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { Unauthorized } from "../errors.js";
import {
  getUserByEmail,
  createUserWithOrganization,
  getUserRoleStrings,
  getUserPermissionStrings,
} from "@safee/database";
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
  public async login(@Body() request: LoginRequest): Promise<LoginResponse> {
    try {
      // Get user by email
      const user = await getUserByEmail(this.context, request.email);

      if (!user) {
        throw new Unauthorized("Invalid email or password");
      }

      if (!user.isActive) {
        throw new Unauthorized("Account is deactivated");
      }

      // Verify password
      const isValidPassword = await passwordService.verifyPassword(request.password, user.passwordHash);

      if (!isValidPassword) {
        throw new Unauthorized("Invalid email or password");
      }

      // Get user roles and permissions
      const roles = await getUserRoleStrings(this.context, user.id);
      const permissions = await getUserPermissionStrings(this.context, user.id);

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        roles,
        permissions,
      };

      const tokens = await jwtService.generateTokenPair(tokenPayload);

      this.context.logger.info({ userId: user.id, email: user.email }, "User logged in successfully");

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
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
      this.context.logger.error({ error, email: request.email }, "Login failed");

      if (error instanceof Error && error.message.includes("Invalid")) {
        this.setStatus(401);
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
  public async logout(): Promise<{ message: string }> {
    // In a stateless JWT system, logout is handled on the client side
    // However, for security, you might want to:
    // 1. Add the token to a blacklist (Redis)
    // 2. Clear any server-side sessions
    // 3. Log the logout event

    this.context.logger.info("User logged out successfully");

    return {
      message: "Logged out successfully",
    };
  }
}
