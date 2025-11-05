import express, { Request, Response, NextFunction, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import session from "express-session";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import { ValidateError } from "tsoa";

interface SwaggerRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  credentials?: RequestCredentials;
  body?: unknown;
}

import type { RedisClient, DrizzleClient, Storage, PubSub, JobScheduler, Locale } from "@safee/database";
import { SessionStore } from "./SessionStore.js";
import { RegisterRoutes } from "./routes.js";
import { localeMiddleware } from "./middleware/localeMiddleware.js";
import { ApiError } from "./errors.js";
import swaggerDocument from "./swagger.json" with { type: "json" };
import pg from "pg";
import { initServerContext } from "./serverContext.js";
import { initOdooClientManager } from "./services/odoo/manager.service.js";
import { hoursToMilliseconds } from "date-fns";
import { toNodeHandler } from "better-auth/node";
import { initAuth, getAuth } from "../auth/index.js";
import { mergeBetterAuthSpec } from "./mergeOpenApiSpecs.js";
import type { OpenAPIV3 } from "openapi-types";

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
  app.set("trust proxy", 1);
  const odoo = initOdooClientManager(drizzle, logger as unknown as Logger);

  // Parse JSON and URL-encoded bodies FIRST
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS middleware BEFORE auth routes
  app.use(
    cors({
      origin: [
        process.env.CORS_ORIGIN || "http://localhost:3001",
        process.env.FRONTEND_URL || "http://localhost:3001",
        process.env.LANDING_URL || "http://localhost:3002",
        "http://localhost:8080",
        "http://app.localhost:8080",
        "http://api.localhost:8080",
      ],
      credentials: true,
    }),
  );

  app.use(localeMiddleware);

  // Initialize Better Auth AFTER CORS and body parsing
  initAuth(drizzle);
  logger.info("Better Auth initialized");

  app.all("/api/v1/auth/*", toNodeHandler(getAuth()));
  logger.info("Better Auth mounted at /api/v1/auth/*");

  logger.info("Odoo client manager initialized");

  app.use((req, _res, next) => {
    req.redis = redis;
    req.drizzle = drizzle;
    next();
  });
  initServerContext({
    drizzle,
    logger: logger as unknown as Logger,
    redis,
    storage,
    pubsub,
    scheduler,
    odoo,
  });

  app.use(helmet());

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
          maxAge: hoursToMilliseconds(24),
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

  const swaggerUiOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Safee Analytics API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      requestInterceptor: (req: SwaggerRequest): SwaggerRequest => {
        req.credentials = "include";
        return req;
      },
    },
  };

  let mergedSpec = swaggerDocument as OpenAPIV3.Document;
  try {
    // @ts-expect-error - Better Auth OpenAPI methods may vary by version
    const betterAuthSpec = await getAuth().api.generateOpenAPISchema?.();

    mergedSpec = mergeBetterAuthSpec(
      swaggerDocument as OpenAPIV3.Document,
      betterAuthSpec as OpenAPIV3.Document,
    );
  } catch (err) {
    logger.warn({ err }, "Could not generate Better Auth OpenAPI spec, using TSOA spec only");
  }

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(mergedSpec, swaggerUiOptions));

  app.get("/", (_req, res) => {
    res.json({
      message: "Safee Analytics API",
      version: "1.0.0",
      docs: "/docs",
    });
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidateError) {
      logger.info({ err, url: req.url, userId: req.authenticatedUserId }, "validation error");
      return res.status(422).json({
        message: "Validation Failed",
        details: err.fields,
      });
    }

    if (err instanceof ApiError) {
      logger.info(
        {
          err,
          url: req.url,
          userId: req.authenticatedUserId,
          code: err.code,
          statusCode: err.statusCode,
        },
        "api error",
      );

      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code,
        ...(Object.keys(err.context || {}).length > 0 && { context: err.context }),
      });
    }

    logger.error(
      { err, url: req.url, userId: req.authenticatedUserId },
      "Error in request handler reached end of chain",
    );
    return res.status(500).json({
      message: "Internal Server Error",
    });
  });

  app.use("*", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  await scheduler.start({ drizzle, logger: logger as unknown as Logger });
  logger.info("Job scheduler started");

  return app;
}

export async function startServer(deps: Dependencies) {
  const app = await server(deps);

  app.listen(PORT, HOST, () => {
    deps.logger.info("Server listening on %s:%s", HOST, PORT);
    deps.logger.info("API Documentation available at: http://%s:%s/docs", HOST, PORT);
    deps.logger.info("Health Check available at: http://%s:%s/api/v1/health", HOST, PORT);
  });

  return app;
}
