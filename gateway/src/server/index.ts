import express, { Request, Response, NextFunction, Application, json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import { config as dotenvConfig } from "dotenv";
import { serve as swaggerServe, setup as swaggerSetup } from "swagger-ui-express";
import session from "express-session";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import { ValidateError } from "tsoa";

import type { RedisClient, DrizzleClient, Storage, PubSub, JobScheduler } from "@safee/database";
import type { QueueManager } from "@safee/jobs";
import { SessionStore } from "./SessionStore.js";
import { RegisterRoutes } from "./routes.js";
import { localeMiddleware } from "./middleware/localeMiddleware.js";
import { loggingMiddleware } from "./middleware/logging.js";
import type { AuthenticatedRequest } from "./middleware/auth.js";
import { ApiError } from "./errors.js";
import swaggerDocument from "./swagger.json" with { type: "json" };
import { initServerContext } from "./serverContext.js";
import { odoo } from "@safee/database";
import { ODOO_URL, ODOO_PORT, JWT_SECRET } from "../env.js";
import { hoursToMilliseconds } from "date-fns";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/index.js";
import { mergeBetterAuthSpec } from "./mergeOpenApiSpecs.js";
import type { OpenAPIV3 } from "openapi-types";
import { WebSocketService } from "./services/websocket.service.js";
import { getChunkedUploadServiceInstance } from "./services/chunked-upload-instance.js";
import { setupBullBoard } from "./bull-board.js";

dotenvConfig();

const HOST = process.env.HOST ?? "localhost";
const PORT = Number(process.env.PORT) || 3000;
const IS_LOCAL = process.env.NODE_ENV !== "production";
const COOKIE_KEY = process.env.COOKIE_KEY;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

type Dependencies = {
  logger: Logger<"http">;
  redis: RedisClient;
  drizzle: DrizzleClient;
  storage: Storage;
  pubsub: PubSub;
  scheduler: JobScheduler;
  queueManager: QueueManager;
};

export async function server({
  logger,
  redis,
  drizzle,
  storage,
  pubsub,
  scheduler,
  queueManager,
}: Dependencies) {
  logger.info("Configuring Safee Analytics API server");

  const app: Application = express();

  app.disable("x-powered-by");

  if (IS_LOCAL) {
    logger.warn("Running in local mode");
  }
  app.set("trust proxy", 1);

  const odooUserProvisioningService = new odoo.OdooUserProvisioningService({
    drizzle,
    logger: logger as unknown as Logger,
    encryptionService: new odoo.EncryptionService(JWT_SECRET),
    odooUrl: ODOO_URL,
  });

  const odooClientManager = odoo.initOdooClientManager({
    drizzle,
    logger: logger as unknown as Logger,
    odooConfig: {
      url: ODOO_URL,
      port: ODOO_PORT,
    },
    userProvisioningService: odooUserProvisioningService,
  });

  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ extended: true, limit: "10mb" }));

  app.use(
    cors({
      origin: [
        process.env.CORS_ORIGIN ?? "http://localhost:3001",
        process.env.FRONTEND_URL ?? "http://localhost:3001",
        process.env.LANDING_URL ?? "http://localhost:3002",
        process.env.ADMIN_URL ?? "http://localhost:3003",
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:8080",
        "http://app.localhost:8080",
        "http://api.localhost:8080",
        "http://admin.localhost:8080",
      ],
      credentials: true,
    }),
  );

  app.use(localeMiddleware);

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
    queueManager,
    odoo: odooClientManager,
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'self'", "http://localhost:3003", "http://admin.localhost:8080"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          upgradeInsecureRequests: [],
        },
      },
      // Keep frameguard enabled for defense in depth (CSP frameAncestors is primary protection)
      frameguard: { action: "sameorigin" },
    }),
  );

  logger.info("Shared key authorization: %s", API_SECRET_KEY ? "Required" : "Disabled");
  if (API_SECRET_KEY) {
    app.use((req, res, next) => {
      const apiKey = req.headers["x-safee-api-key"];
      if (apiKey !== API_SECRET_KEY) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      next();
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

  app.use(loggingMiddleware(logger as unknown as Logger));

  app.use(
    pinoHttp(
      {
        useLevel: "http",
        logger,
        serializers: {
          req(req: { body: unknown; raw: { body: unknown } }) {
            req.body = req.raw.body;
            return req;
          },
        },
        customProps: (req) => {
          const authReq = req as unknown as AuthenticatedRequest;
          return {
            userId: authReq.betterAuthSession?.user.id,
            organizationId: authReq.betterAuthSession?.session.activeOrganizationId,
          };
        },
      },
      undefined,
    ),
  );

  RegisterRoutes(app);
  app.all("/api/v1/*", toNodeHandler(auth));
  logger.info("Better Auth mounted at /api/v1/auth/*");

  const bullBoardAdapter = setupBullBoard(logger as unknown as Logger, redis);
  app.use(
    "/admin/queues",
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'self'", "http://localhost:3003", "http://admin.localhost:8080"],
        },
      },
    }),
    bullBoardAdapter.getRouter() as never,
  );
  logger.info("Bull Board mounted at /admin/queues");

  const swaggerUiOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Safee Analytics API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  };

  let mergedSpec = swaggerDocument as OpenAPIV3.Document;
  try {
    const betterAuthSpec = await auth.api.generateOpenAPISchema();

    mergedSpec = mergeBetterAuthSpec(
      swaggerDocument as OpenAPIV3.Document,
      betterAuthSpec as OpenAPIV3.Document,
    );
  } catch (err) {
    logger.warn({ err }, "Could not generate Better Auth OpenAPI spec, using TSOA spec only");
  }

  app.use("/docs", swaggerServe, swaggerSetup(mergedSpec, swaggerUiOptions));

  app.get("/", (_req, res) => {
    res.json({
      message: "Safee Analytics API",
      version: "1.0.0",
      docs: "/docs",
    });
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidateError) {
      logger.info({ err, url: req.url, userId: req.betterAuthSession?.user.id }, "validation error");
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
          userId: req.betterAuthSession?.user.id,
          code: err.code,
          statusCode: err.statusCode,
        },
        "api error",
      );

      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code,
        ...(Object.keys(err.context).length > 0 && { context: err.context }),
      });
    }

    logger.error(
      {
        err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
        url: req.url,
        method: req.method,
        userId: req.betterAuthSession?.user.id,
      },
      "Unhandled error in request handler",
    );
    return res.status(500).json({
      message: "Internal Server Error",
    });
  });

  app.use("*", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  await scheduler.start({ drizzle, logger: logger as unknown as Logger });

  return app;
}

export async function startServer(deps: Dependencies) {
  const app = await server(deps);

  const httpServer = app.listen(PORT, HOST, () => {
    deps.logger.info("Server listening on %s:%s", HOST, PORT);
    deps.logger.info("API Documentation available at: http://%s:%s/docs", HOST, PORT);
    deps.logger.info("Health Check available at: http://%s:%s/api/v1/health", HOST, PORT);
    deps.logger.info("WebSocket server available at: ws://%s:%s/ws", HOST, PORT);
  });

  const wsService = new WebSocketService(httpServer);

  const chunkedUploadService = getChunkedUploadServiceInstance();
  chunkedUploadService.setWebSocketService(wsService);
  deps.logger.info("WebSocket service connected to ChunkedUploadService");

  async function shutdown() {
    deps.logger.info("Starting graceful shutdown...");
    await wsService.shutdown();
    httpServer.close(() => {
      deps.logger.info("HTTP server closed");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());

  return { httpServer, wsService };
}
