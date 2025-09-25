import jwt, { type SignOptions } from "jsonwebtoken";
import { getAuthConfig } from "../../config/index.js";
import { logger } from "../utils/logger.js";

export interface JwtPayload {
  userId: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: "refresh";
}

export class JwtService {
  private readonly config = getAuthConfig();

  constructor() {
    if (this.config.enableAuthentication) {
      logger.info("JWT Service initialized with authentication enabled");
    } else {
      logger.warn("🚨 JWT Service initialized with authentication DISABLED - Development mode only!");
    }
  }

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    if (!this.config.enableAuthentication) {
      logger.debug("Authentication disabled - returning mock tokens");
      return {
        accessToken: "dev-access-token",
        refreshToken: "dev-refresh-token",
        expiresIn: 3600, // 1 hour in seconds
      };
    }

    try {
      const accessToken = jwt.sign(
        {
          ...payload,
          type: "access",
        },
        this.config.jwtSecret,
        {
          expiresIn: this.config.jwtExpiresIn,
          issuer: "safee-analytics",
          audience: "safee-api",
        } as SignOptions,
      );

      const tokenId = `${payload.userId}-${Date.now()}-${Math.random().toString(36).substring(2)}`;

      const refreshToken = jwt.sign(
        {
          userId: payload.userId,
          tokenId,
          type: "refresh",
        } as RefreshTokenPayload,
        this.config.jwtSecret,
        {
          expiresIn: this.config.jwtRefreshExpiresIn,
          issuer: "safee-analytics",
          audience: "safee-api",
        } as SignOptions,
      );

      const expiresIn = this.parseExpiresIn(this.config.jwtExpiresIn);

      logger.debug({ userId: payload.userId }, "Token pair generated successfully");

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error({ error }, "Failed to generate token pair");
      throw new Error("Token generation failed");
    }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    if (!this.config.enableAuthentication) {
      logger.debug("Authentication disabled - returning mock user");
      return {
        userId: "dev-user-id",
        organizationId: "dev-org-id",
        email: "dev@example.com",
        roles: ["admin"],
        permissions: ["*"],
      };
    }

    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: "safee-analytics",
        audience: "safee-api",
      }) as JwtPayload & { type: string };

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      logger.debug({ userId: decoded.userId }, "Access token verified successfully");

      return {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        email: decoded.email,
        roles: decoded.roles,
        permissions: decoded.permissions,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, "Invalid JWT token");
        throw new Error("Invalid token");
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.warn("JWT token expired");
        throw new Error("Token expired");
      } else {
        logger.error({ error }, "Token verification failed");
        throw new Error("Token verification failed");
      }
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    if (!this.config.enableAuthentication) {
      logger.debug("Authentication disabled - returning mock refresh token payload");
      return {
        userId: "dev-user-id",
        tokenId: "dev-token-id",
        type: "refresh",
      };
    }

    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: "safee-analytics",
        audience: "safee-api",
      }) as RefreshTokenPayload;

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      logger.debug({ userId: decoded.userId }, "Refresh token verified successfully");

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, "Invalid refresh token");
        throw new Error("Invalid refresh token");
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.warn("Refresh token expired");
        throw new Error("Refresh token expired");
      } else {
        logger.error({ error }, "Refresh token verification failed");
        throw new Error("Refresh token verification failed");
      }
    }
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      return null;
    }

    return token;
  }

  isAuthEnabled(): boolean {
    return this.config.enableAuthentication;
  }

  private parseExpiresIn(expiresIn: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    };

    const match = expiresIn.match(/^(\d+)([smhdw])$/);

    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 1);
  }

  generateDevToken(userId: string = "dev-user"): string {
    if (this.config.enableAuthentication) {
      throw new Error("Development tokens are only available when authentication is disabled");
    }

    return `dev-token-${userId}-${Date.now()}`;
  }
}

export const jwtService = new JwtService();
