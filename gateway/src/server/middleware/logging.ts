import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import type { Logger } from "pino";

export function loggingMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.requestId = randomUUID();
    req.startTime = Date.now();

    req.log = logger.child({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
    });

    req.log.info(
      {
        url: req.url,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      "→ Incoming request",
    );

    const originalSend = res.send;
    let responseBody: unknown;

    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

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
          ...(statusCode >= 400 && responseBody ? { responseBody } : {}),
        },
        `← Response ${statusCode} (${duration}ms)`,
      );
    });

    next();
  };
}

export function addAuthContextToLogger(req: Request, userId: string, organizationId?: string | null) {
  req.log = req.log.child({
    userId,
    organizationId,
  });

  req.log.debug({ userId, organizationId }, "Authentication context added to logger");
}

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
