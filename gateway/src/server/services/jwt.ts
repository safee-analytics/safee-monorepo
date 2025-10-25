import jwt, { type SignOptions } from "jsonwebtoken";
import { getAuthConfig } from "../../config/index.js";
import { logger } from "../utils/logger.js";
import { InvalidToken, TokenExpired, BadRequest } from "../errors.js";

export interface JwtPayload {
  userId: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  tokenId: string;
  sessionId?: string;
  type: "refresh";
}

export class JwtService {
  private readonly config = getAuthConfig();

  constructor() {
    logger.info("JWT Service initialized with authentication enabled");
  }

  async generateAccessToken(payload: JwtPayload): Promise<{ accessToken: string; expiresIn: number }> {
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

      const expiresIn = this.parseExpiresIn(this.config.jwtExpiresIn);

      logger.debug({ userId: payload.userId }, "Access token generated successfully");

      return {
        accessToken,
        expiresIn,
      };
    } catch (error) {
      logger.error({ error }, "Failed to generate access token");
      throw new BadRequest("Access token generation failed");
    }
  }

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
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
          organizationId: payload.organizationId,
          email: payload.email,
          tokenId,
          sessionId: payload.sessionId,
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
      throw new BadRequest("Token generation failed");
    }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: "safee-analytics",
        audience: "safee-api",
      }) as JwtPayload & { type: string };

      if (decoded.type !== "access") {
        throw new InvalidToken();
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
        throw new InvalidToken();
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.warn("JWT token expired");
        throw new TokenExpired();
      } else {
        logger.error({ error }, "Token verification failed");
        throw new InvalidToken();
      }
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: "safee-analytics",
        audience: "safee-api",
      }) as RefreshTokenPayload;

      if (decoded.type !== "refresh") {
        throw new InvalidToken();
      }

      logger.debug({ userId: decoded.userId }, "Refresh token verified successfully");

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, "Invalid refresh token");
        throw new InvalidToken();
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.warn("Refresh token expired");
        throw new TokenExpired();
      } else {
        logger.error({ error }, "Refresh token verification failed");
        throw new InvalidToken();
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
      throw new BadRequest(`Invalid expiresIn format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 1);
  }
}

export const jwtService = new JwtService();
