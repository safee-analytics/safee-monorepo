/**
 * Structured logging middleware with request context
 */

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import type { Logger } from "pino";

export function loggingMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate unique request ID
    req.requestId = randomUUID();
    req.startTime = Date.now();

    // Create request-scoped logger with context
    req.log = logger.child({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
    });

    // Log incoming request
    req.log.info(
      {
        url: req.url,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      "→ Incoming request",
    );

    // Capture response
    const originalSend = res.send;
    let responseBody: unknown;

    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Log response when finished
    res.on("finish", () => {
      const duration = Date.now() - req.startTime;
      const statusCode = res.statusCode;
      const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

      req.log[level](
        {
          statusCode,
          duration,
          userId: req.betterAuthSession?.user?.id,
          organizationId: req.betterAuthSession?.session?.activeOrganizationId,
          // Don't log response body for successful requests to reduce noise
          ...(statusCode >= 400 && responseBody ? { responseBody } : {}),
        },
        `← Response ${statusCode} (${duration}ms)`,
      );
    });

    next();
  };
}

/**
 * Update request logger with authentication context
 */
export function addAuthContextToLogger(req: Request, userId: string, organizationId?: string | null) {
  req.log = req.log.child({
    userId,
    organizationId,
  });

  req.log.debug({ userId, organizationId }, "Authentication context added to logger");
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const sensitive = ["password", "token", "secret", "apiKey", "authorization"];
  const sanitized: Record<string, unknown> = { ...obj };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitive.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key] as Record<string, unknown>);
    }
  }

  return sanitized;
}
