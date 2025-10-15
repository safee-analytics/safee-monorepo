import express, { Request, Response, NextFunction, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import session from "express-session";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import { ValidateError } from "tsoa";
import type { RedisClient, DrizzleClient, Storage, PubSub, JobScheduler, Locale } from "@safee/database";
import { SessionStore } from "./SessionStore.js";
import { RegisterRoutes } from "./routes.js";
import { localeMiddleware } from "./middleware/localeMiddleware.js";
import swaggerDocument from "./swagger.json" with { type: "json" };
import pg from "pg";
import { initServerContext } from "./serverContext.js";

dotenv.config();

const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT) || 3000;
const IS_LOCAL = process.env.NODE_ENV !== "production";
const COOKIE_KEY = process.env.COOKIE_KEY;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

type Dependencies = {
  logger: Logger<"http">;
  redis: RedisClient;
  drizzle: DrizzleClient;
  pool: pg.Pool;
  storage: Storage;
  pubsub: PubSub;
  scheduler: JobScheduler;
};

declare module "express-session" {
  interface SessionData {
    userId: string;
    organizationId: string;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      redis: RedisClient;
      drizzle: DrizzleClient;
      locale: Locale;

      authenticatedUserId?: string;
      organizationId?: string;
      authType?: "session" | "jwt";
    }
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public context?: Record<string, unknown>;
  public code?: string;

  constructor(message: string, statusCode: number = 500, context?: Record<string, unknown>, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.context = context;
    this.code = code;
  }
}

export async function server({
  logger,
  redis,
  drizzle,
  pool: _pool,
  storage,
  pubsub,
  scheduler,
}: Dependencies) {
  logger.info("Configuring Safee Analytics API server");

  const app: Application = express();

  app.disable("x-powered-by");

  if (IS_LOCAL) {
    logger.warn("Running in local mode");
  }
  app.set("trust proxy", !IS_LOCAL ? 1 : 0);

  // Body parsing middleware (needed for body to show up properly in logging)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Locale detection middleware
  app.use(localeMiddleware);

  // Dependency injection middleware
  app.use((req, _res, next) => {
    req.redis = redis;
    req.drizzle = drizzle;
    next();
  });
  initServerContext({ drizzle, logger: logger as unknown as Logger, redis, storage, pubsub, scheduler });

  app.use(helmet());

  // API secret key authorization
  logger.info("Shared key authorization: %s", API_SECRET_KEY ? "Required" : "Disabled");
  if (API_SECRET_KEY) {
    app.use((req, res, next) => {
      const apiKey = req.headers["x-safee-api-key"];
      if (apiKey !== API_SECRET_KEY) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      return next();
    });
  }

  logger.info("Cookie authorization: %s", COOKIE_KEY ? "Enabled" : "Disabled");
  if (COOKIE_KEY) {
    app.use(
      session({
        secret: [COOKIE_KEY],
        resave: true,
        rolling: false,
        name: "safee-session",
        unset: "destroy",
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          httpOnly: true,
          signed: true,
          secure: !IS_LOCAL,
          sameSite: IS_LOCAL ? "lax" : "none",
        },
        store: new SessionStore(redis),
      }),
    );
  }

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    }),
  );

  app.use(
    pinoHttp(
      {
        useLevel: "http",
        logger,
        serializers: {
          req(req: { body: unknown; raw: { body: unknown } }) {
            req.body = req.raw?.body;
            return req;
          },
        },
        customProps: (req) => ({
          userId: req.authenticatedUserId ?? "unknown",
          organizationId: req.organizationId ?? "unknown",
        }),
      },
      undefined,
    ),
  );

  RegisterRoutes(app);

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Safee Analytics API Documentation",
    }),
  );

  app.get("/", (_req, res) => {
    res.json({
      message: "Safee Analytics API",
      version: "1.0.0",
      docs: "/docs",
    });
  });

  // Error handling middleware
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      logger.info({ err, url: req.url, userId: req.authenticatedUserId }, "api error");
      return res.status(err.statusCode).json({
        message: err.message,
        context: err.context,
        code: err.code,
      });
    }

    if (err instanceof ValidateError) {
      logger.info({ err, url: req.url, userId: req.authenticatedUserId }, "validation error");
      return res.status(422).json({
        message: "Validation Failed",
        details: err.fields,
      });
    }

    req.log.error({ err }, "Error in request handler reached end of chain");
    return res.status(500).json({
      message: "Internal Server Error",
    });
  });

  // 404 handler
  app.use("*", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  // Start the job scheduler
  await scheduler.start({ drizzle, logger: logger as unknown as Logger });
  logger.info("Job scheduler started");

  app.listen(PORT, HOST, () => {
    logger.info("Server listening on %s:%s", HOST, PORT);
    logger.info("API Documentation available at: http://%s:%s/docs", HOST, PORT);
    logger.info("Health Check available at: http://%s:%s/api/v1/health", HOST, PORT);
  });
}
